import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, ChevronRight, Shield, User as UserIcon, Users, ZoomIn, ZoomOut, Maximize2, Download, Move } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';

interface OrganizationGraphProps {
    users: any[];
}

interface TreeNode {
    user: any;
    children: TreeNode[];
}

const OrganizationGraph: React.FC<OrganizationGraphProps> = ({ users }) => {
    const { showToast } = useToast();
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const toggleNode = (userId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedNodes(newExpanded);
    };

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleZoomReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Pan controls
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click only
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Mouse wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    // Export to PNG
    const handleExportPNG = async () => {
        try {
            // Dynamically import html2canvas
            const html2canvas = (await import('html2canvas')).default;
            
            if (contentRef.current) {
                // Temporarily reset zoom and pan for clean export
                const originalZoom = zoom;
                const originalPan = pan;
                setZoom(1);
                setPan({ x: 0, y: 0 });

                // Wait for state update
                await new Promise(resolve => setTimeout(resolve, 100));

                const canvas = await html2canvas(contentRef.current, {
                    backgroundColor: '#09090b',
                    scale: 2,
                });

                // Restore zoom and pan
                setZoom(originalZoom);
                setPan(originalPan);

                // Download
                const link = document.createElement('a');
                link.download = `kyokushin-org-chart-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();

                showToast('Organization chart exported successfully!', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Failed to export chart. Please try again.', 'error');
        }
    };

    // Collapse all nodes
    const handleCollapseAll = () => {
        if (tree) {
            const newExpanded = new Set<string>();
            newExpanded.add(tree.user.id);
            setExpandedNodes(newExpanded);
        }
    };

    // Expand all nodes
    const handleExpandAll = () => {
        const allIds = new Set<string>();
        const collectIds = (node: TreeNode) => {
            allIds.add(node.user.id);
            node.children.forEach(child => collectIds(child));
        };
        if (tree) {
            collectIds(tree);
            setExpandedNodes(allIds);
        }
    };

    // Build the hierarchy tree
    const tree = useMemo(() => {
        if (!users || users.length === 0) return null;

        // 1. Find the Root (Shihan Vasant Singh - Admin)
        // We look for role 'ADMIN' or specific name if needed.
        // Assuming there is only one main admin or we pick the first one.
        const rootUser = users.find(u => u.role === 'ADMIN') || users.find(u => u.name?.includes('Vasant'));

        if (!rootUser) return null;

        const buildNode = (currentUser: any): TreeNode => {
            let directReports = [];

            if (currentUser.role === 'ADMIN') {
                // Admin (Country Director) sees all instructors
                directReports = users.filter(u =>
                    u.role === 'INSTRUCTOR' && u.id !== currentUser.id
                );
            } else if (currentUser.role === 'INSTRUCTOR') {
                // Instructor sees:
                // 1. Students explicitly assigned to them (primaryInstructorId)
                // 2. Students in same dojo without any instructor assigned (fallback)
                directReports = users.filter(u =>
                    u.role === 'STUDENT' && (
                        u.primaryInstructorId === currentUser.id ||
                        (u.dojoId === currentUser.dojoId && !u.primaryInstructorId)
                    )
                );
            }
            // Students have no direct reports

            return {
                user: currentUser,
                children: directReports.map(child => buildNode(child))
            };
        };

        return buildNode(rootUser);
    }, [users]);

    // Initialize expanded state for root and first level
    React.useEffect(() => {
        if (tree) {
            const initialExpanded = new Set<string>();
            initialExpanded.add(tree.user.id);
            tree.children.forEach(child => initialExpanded.add(child.user.id));
            setExpandedNodes(initialExpanded);
        }
    }, [tree]);

    const renderNode = (node: TreeNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.user.id);
        const hasChildren = node.children && node.children.length > 0;

        // Color coding based on role/level
        let badgeColor = "bg-gray-500";
        let roleName = node.user.role;

        if (node.user.role === 'ADMIN') {
            badgeColor = "bg-red-600";
            roleName = "India Director";
        } else if (node.user.role === 'INSTRUCTOR') {
            badgeColor = "bg-orange-500";
        } else {
            badgeColor = "bg-blue-500";
        }

        return (
            <div className="flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                        relative z-10 flex flex-col items-center p-4 rounded-xl border border-white/10
                        backdrop-blur-md bg-zinc-900/80 shadow-xl transition-all duration-300
                        ${isExpanded ? 'ring-2 ring-white/10' : ''}
                        hover:scale-105 hover:bg-zinc-800
                        min-w-[200px] cursor-pointer
                    `}
                    onClick={() => hasChildren && toggleNode(node.user.id)}
                >
                    {/* Connection Line to Parent (Top) */}
                    {level > 0 && (
                        <div className="absolute -top-6 left-1/2 w-px h-6 bg-white/20 -translate-x-1/2" />
                    )}

                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badgeColor} text-white font-bold shadow-lg`}>
                            {getImageUrl(node.user.profilePhotoUrl) ? (
                                <img src={getImageUrl(node.user.profilePhotoUrl)!} alt={node.user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-sm">{node.user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-white leading-tight">{node.user.name}</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{roleName}</p>
                        </div>
                    </div>

                    {/* Stats or Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 w-full pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span>{node.children.length} Reports</span>
                        </div>
                        {node.user.dojo && (
                            <div className="flex items-center gap-1 truncate max-w-[100px]">
                                <Shield size={12} />
                                <span className="truncate">{node.user.dojo.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Expand/Collapse Indicator */}
                    {hasChildren && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-gray-400">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                    )}
                </motion.div>

                {/* Children Container */}
                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex pt-8 gap-8 items-start justify-center relative"
                        >
                            {/* Horizontal Connecting Line */}
                            {node.children.length > 1 && (
                                <div className="absolute top-4 left-[calc(50%-50%)] right-[calc(50%-50%)] h-px bg-white/20 w-[calc(100%-200px)]" />
                            )}

                            {/* Individual Children */}
                            {node.children.map((child, index) => (
                                <div key={child.user.id} className="relative flex flex-col items-center">
                                    {/* Vertical Line from Horizontal Bar to Child */}
                                    <div className="absolute -top-4 left-1/2 w-px h-4 bg-white/20 -translate-x-1/2" />
                                    {renderNode(child, level + 1)}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (!tree) {
        return (
            <div className="p-8 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                Organization structure not available. Ensure an Admin user exists.
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-200px)] bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
            {/* Control Panel */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 p-2">
                <Button
                    onClick={handleZoomIn}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                    onClick={handleZoomOut}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                    onClick={handleZoomReset}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                    title="Reset View"
                >
                    <Maximize2 className="w-4 h-4" />
                </Button>
                <div className="h-px bg-white/10 my-1" />
                <Button
                    onClick={handleExportPNG}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                    title="Export as PNG"
                >
                    <Download className="w-4 h-4" />
                </Button>
            </div>

            {/* Zoom/Pan Controls Info */}
            <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <Move className="w-3 h-3" />
                        <span>Drag to pan</span>
                    </div>
                    <span className="text-white/20">•</span>
                    <span>Scroll to zoom</span>
                    <span className="text-white/20">•</span>
                    <span className="text-white font-semibold">{Math.round(zoom * 100)}%</span>
                </div>
            </div>

            {/* Expand/Collapse All Controls */}
            <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                <Button
                    onClick={handleExpandAll}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 bg-black/80 backdrop-blur-xl border border-white/10"
                >
                    Expand All
                </Button>
                <Button
                    onClick={handleCollapseAll}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 bg-black/80 backdrop-blur-xl border border-white/10"
                >
                    Collapse All
                </Button>
            </div>

            {/* Chart Container */}
            <div
                ref={containerRef}
                className="w-full h-full overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <div
                    ref={contentRef}
                    className="w-full h-full flex items-center justify-center transition-transform"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <div className="pb-12 pt-4">
                        {renderNode(tree)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationGraph;
