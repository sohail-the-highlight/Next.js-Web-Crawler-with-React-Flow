import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  const { startUrl, maxDepth = 2 } = await request.json();

  if (!startUrl) {
    return NextResponse.json({ error: 'Start URL is required' }, { status: 400 });
  }

  const visited = new Set<string>();
  const pages: { url: string; title: string; links: string[] }[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
  
  // LIMIT THE CRAWL to 50 pages to keep the UI clean
  const MAX_PAGES = 50; 

  const normalizeUrl = (link: string, base: string) => {
    try {
      const fullUrl = new URL(link, base);
      if (fullUrl.hostname !== new URL(base).hostname) return null;
      return fullUrl.origin + fullUrl.pathname;
    } catch (e) {
      return null;
    }
  };

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const current = queue.shift()!;
    
    if (visited.has(current.url) || current.depth > maxDepth) continue;
    visited.add(current.url);

    try {
      const response = await axios.get(current.url, { timeout: 5000 });
      const html = response.data;
      const $ = cheerio.load(html);
      const title = $('title').text().trim() || current.url;
      
      const pageLinks: string[] = [];

      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const normalized = normalizeUrl(href, startUrl);
          if (normalized && normalized !== current.url) {
            pageLinks.push(normalized);
            if (!visited.has(normalized)) {
              queue.push({ url: normalized, depth: current.depth + 1 });
            }
          }
        }
      });

      pages.push({ url: current.url, title, links: [...new Set(pageLinks)] });

    } catch (error) {
      console.error(`Failed to crawl ${current.url}`);
    }
  }

  // NOISE REDUCTION
  // If a link appears on > 30% of pages (like a footer link), ignore it.
  const linkFrequency: Record<string, number> = {};
  pages.forEach(page => {
    page.links.forEach(link => {
      linkFrequency[link] = (linkFrequency[link] || 0) + 1;
    });
  });

  const totalPages = pages.length;
  // Lowered threshold to 0.3 (30%) to catch more navbars/sidebars
  const globalThreshold = 0.3; 
  const globalLinks = new Set<string>();

  Object.entries(linkFrequency).forEach(([link, count]) => {
    if (count / totalPages > globalThreshold) {
      globalLinks.add(link);
    }
  });

  // PREPARE DATA FOR FRONTEND
  // We don't calculate positions here anymore; the frontend will do it with Dagre
  const nodes = pages.map((page) => ({
    id: page.url,
    data: { label: page.title.slice(0, 30) + (page.title.length > 30 ? '...' : '') },
    position: { x: 0, y: 0 }, // Placeholder, frontend will fix this
    type: 'default'
  }));

  const edges: any[] = [];
  const addedEdges = new Set<string>();

  pages.forEach(page => {
    page.links.forEach(targetUrl => {
      if (visited.has(targetUrl) && !globalLinks.has(targetUrl)) {
        const edgeId = `${page.url}-${targetUrl}`;
        if(!addedEdges.has(edgeId)) {
            edges.push({
                id: edgeId,
                source: page.url,
                target: targetUrl,
                animated: true,
                style: { stroke: '#b1b1b7' },
              });
            addedEdges.add(edgeId);
        }
      }
    });
  });

  return NextResponse.json({ nodes, edges, crawledCount: pages.length });
}