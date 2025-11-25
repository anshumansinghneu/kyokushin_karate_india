import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, ChevronRight, Shield, User as UserIcon, Users } from 'lucide-react';

interface OrganizationGraphProps {
    users: any[];
}

interface TreeNode {
    user: any;
    children: TreeNode[];
}

const OrganizationGraph: React.FC<OrganizationGraphProps> = ({ users }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const toggleNode = (userId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedNodes(newExpanded);
    };

    // Build the hierarchy tree
    const tree = useMemo(() => {
        if (!users || users.length === 0) return null;

        // 1. Find the Root (Shihan Vasant Singh - Admin)
        // We look for role 'ADMIN' or specific name if needed. 
        // Assuming there is only one main admin or we pick the first one.
        const rootUser = users.find(u => u.role === 'ADMIN') || users.find(u => u.name.includes('Vasant'));

        if (!rootUser) return null;

        const buildNode = (currentUser: any): TreeNode => {
            // Find direct reports: users whose primaryInstructorId matches currentUser.id
            // OR for the root admin, we might want to include all INSTRUCTORS who don't have a primary instructor set (top level instructors)

            let directReports = users.filter(u => u.primaryInstructorId === currentUser.id);

            // Special case for Root: If no explicit primaryInstructorId link to Admin, 
            // assume all other INSTRUCTORS report to Admin if they don't have another instructor.
            if (currentUser.role === 'ADMIN') {
                const topLevelInstructors = users.filter(u =>
                    u.role === 'INSTRUCTOR' &&
                    u.id !== currentUser.id &&
                    (!u.primaryInstructorId || u.primaryInstructorId === currentUser.id)
                );
                // Merge and deduplicate
                const combined = [...directReports, ...topLevelInstructors];
                directReports = Array.from(new Set(combined.map(u => u.id)))
                    .map(id => combined.find(u => u.id === id));
            }

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
                            {node.user.profilePhotoUrl ? (
                                <img src={node.user.profilePhotoUrl} alt={node.user.name} className="w-full h-full rounded-full object-cover" />
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
        <div className="w-full overflow-x-auto pb-12 pt-4 custom-scrollbar">
            <div className="min-w-max flex justify-center">
                {renderNode(tree)}
            </div>
        </div>
    );
};

export default OrganizationGraph;
