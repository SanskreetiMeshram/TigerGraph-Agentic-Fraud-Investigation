import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers, Info } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: string;
  details?: any;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  relation: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface GraphVisualizerProps {
  graphData: GraphData;
  isLoading: boolean;
  onSelectNode?: (node: Node) => void;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  customer: { bg: '#d1fae5', border: '#10b981', text: '#065f46' }, // Emerald
  card: { bg: '#e0e7ff', border: '#4f46e5', text: '#312e81' }, // Indigo
  transaction: { bg: '#fef3c7', border: '#d97706', text: '#78350f' }, // Amber
  device: { bg: '#f3e8ff', border: '#9333ea', text: '#581c87' }, // Purple
  region: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' }, // Blue
  connected_card: { bg: '#ffe4e6', border: '#e11d48', text: '#881337' }, // Rose (Syndicate)
  closed_case: { bg: '#f1f5f9', border: '#475569', text: '#1e293b' }, // Slate
};

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  graphData,
  isLoading,
  onSelectNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Physics simulation nodes
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number | null>(null);

  // Initialize or update node positions
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const width = 600;
    const height = 400;
    const count = graphData.nodes.length;

    // Arrange nodes in radial/spring initial layout
    nodesRef.current = graphData.nodes.map((node, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const radius = node.type === 'transaction' ? 0 : node.type === 'card' ? 90 : 160;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
      };
    });

    // Reset view
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [graphData]);

  // Force-directed physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let iterations = 0;

    const tick = () => {
      const nodes = nodesRef.current;
      const edges = graphData.edges || [];

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x! - nodes[i].x!;
          const dy = nodes[j].y! - nodes[i].y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.05;
            nodes[i].vx! -= dx * force;
            nodes[i].vy! -= dy * force;
            nodes[j].vx! += dx * force;
            nodes[j].vy! += dy * force;
          }
        }
      }

      // Edge spring attraction
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      for (const e of edges) {
        const u = nodeMap.get(e.source);
        const v = nodeMap.get(e.target);
        if (u && v) {
          const dx = v.x! - u.x!;
          const dy = v.y! - u.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 90;
          const force = (dist - targetDist) * 0.02;
          u.vx! += (dx / dist) * force;
          u.vy! += (dy / dist) * force;
          v.vx! -= (dx / dist) * force;
          v.vy! -= (dy / dist) * force;
        }
      }

      // Center gravity
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (const n of nodes) {
        n.vx! += (cx - n.x!) * 0.005;
        n.vy! += (cy - n.y!) * 0.005;
        // Damping
        n.vx! *= 0.85;
        n.vy! *= 0.85;
        n.x! += n.vx!;
        n.y! += n.vy!;
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // Draw Edges
      for (const e of edges) {
        const u = nodeMap.get(e.source);
        const v = nodeMap.get(e.target);
        if (u && v) {
          ctx.beginPath();
          ctx.moveTo(u.x!, u.y!);
          ctx.lineTo(v.x!, v.y!);
          ctx.strokeStyle = e.relation.includes('SHARED') ? '#fda4af' : '#cbd5e1';
          ctx.lineWidth = e.relation.includes('SHARED') ? 2 : 1.5;
          ctx.stroke();

          // Edge Label
          const midX = (u.x! + v.x!) / 2;
          const midY = (u.y! + v.y!) / 2;
          ctx.font = '9px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(e.relation, midX, midY - 3);
        }
      }

      // Draw Nodes
      for (const n of nodes) {
        const colors = TYPE_COLORS[n.type] || TYPE_COLORS.card;
        const isHovered = hoveredNode?.id === n.id;
        const isSelected = selectedNode?.id === n.id;
        const radius = n.type === 'transaction' ? 22 : 18;

        // Glow on hover/select
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(n.x!, n.y!, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = colors.bg;
          ctx.fill();
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = colors.border;
        ctx.stroke();

        // Label
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const shortLabel = n.label.split('\n')[0];
        ctx.fillText(shortLabel.length > 14 ? shortLabel.substring(0, 12) + '..' : shortLabel, n.x!, n.y!);

        // Type subtitle below
        ctx.font = '9px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(n.type, n.x!, n.y! + radius + 10);
      }

      ctx.restore();

      iterations++;
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [graphData, offset, scale, hoveredNode, selectedNode]);

  // Mouse interaction: Panning & Hover Detection
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Check hover
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offset.x) / scale;
    const mouseY = (e.clientY - rect.top - offset.y) / scale;

    const hit = nodesRef.current.find((n) => {
      const dx = n.x! - mouseX;
      const dy = n.y! - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 22;
    });

    setHoveredNode(hit || null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      if (onSelectNode) onSelectNode(hoveredNode);
    } else {
      setSelectedNode(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.min(Math.max(0.4, prev * zoomFactor), 2.5));
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Controls & Legend Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
        <Layers className="w-3.5 h-3.5 text-indigo-600" />
        <span>Graph Topology ({graphData?.nodes?.length || 0} nodes, {graphData?.edges?.length || 0} edges)</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-xs">
        <button
          onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}
          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s - 0.15, 0.4))}
          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={420}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
      />

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-10 left-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-2.5 shadow-md text-xs max-w-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 mb-1 font-bold text-slate-900">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>{hoveredNode.label}</span>
          </div>
          <p className="text-[11px] text-slate-500 capitalize">Type: <span className="font-semibold text-slate-700">{hoveredNode.type}</span></p>
          {hoveredNode.details && (
            <div className="text-[10px] text-slate-600 font-mono mt-1 space-y-0.5 max-h-24 overflow-y-auto">
              {Object.entries(hoveredNode.details).slice(0, 4).map(([k, v]) => (
                <div key={k} className="truncate">
                  <span className="text-slate-400">{k}:</span> {String(v)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Legend */}
      <div className="bg-white/80 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Customer</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Card</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Transaction</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Device</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Shared Ring</span>
          </div>
        </div>
        <span className="text-slate-400">Click node to inspect</span>
      </div>
    </div>
  );
};
