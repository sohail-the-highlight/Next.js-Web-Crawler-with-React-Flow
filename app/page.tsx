"use client";
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, Play, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import dagre from 'dagre';

// --- LAYOUT ENGINE (Dagre) ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  dagreGraph.setGraph({ rankdir: 'TB' }); // TB = Top to Bottom layout

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top';
    node.sourcePosition = 'bottom';
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

// --- MAIN COMPONENT CONTENT ---
function FlowMapper() {
  const [url, setUrl] = useState('https://example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const { fitView } = useReactFlow();

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleCrawl = async () => {
    setLoading(true);
    setError('');
    // Don't clear nodes immediately so the user sees something while waiting
    
    try {
      const { data } = await axios.post('/api/crawl', { startUrl: url });
      
      if (data.nodes.length === 0) {
        setError('No pages found. Check the URL.');
        setLoading(false);
        return;
      }

      //  SMART LAYOUT
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        data.nodes,
        data.edges
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

    } catch (err) {
      setError('Failed to crawl. Ensure the URL is valid.');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (nodes.length > 0) {
      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 800 });
      });
    }
  }, [nodes, fitView]);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-1/4 min-w-[300px] bg-white border-r border-gray-200 p-6 flex flex-col shadow-sm z-10">
        <h1 className="text-xl font-bold mb-6 text-gray-900">Intelligent Flow Mapper</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button 
            onClick={handleCrawl}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Play className="w-4 h-4"/>}
            {loading ? 'Crawling...' : 'Start Crawl'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 mt-0.5"/>
              {error}
            </div>
          )}

          <div className="mt-8 text-xs text-gray-500 border-t pt-4">
            <p className="font-semibold mb-2">Updated Logic:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Auto-Layout (Dagre) prevents overlapping</li>
              <li>Limit: Max 50 pages for performance</li>
              <li>Auto-Fit: Zooms to center automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* RIGHT AREA */}
      <div className="flex-1 h-full bg-gray-50 relative">
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded-full border shadow-sm">
          <span className="text-sm font-medium text-gray-600">Detected User Flows</span>
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView // Initial fit
        >
          <Background color="#e1e1e1" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <FlowMapper />
    </ReactFlowProvider>
  );
}