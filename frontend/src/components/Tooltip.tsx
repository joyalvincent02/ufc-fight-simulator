import { useState, useRef, useEffect } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    className?: string;
}

export default function Tooltip({ content, children, className = '' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (containerRef.current && tooltipRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            
            // Calculate position relative to viewport
            let top = containerRect.bottom + 8;
            let left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
            
            // Ensure tooltip doesn't go off-screen horizontally
            const margin = 16;
            if (left < margin) {
                left = margin;
            } else if (left + tooltipRect.width > window.innerWidth - margin) {
                left = window.innerWidth - tooltipRect.width - margin;
            }
            
            // If tooltip would go below viewport, show it above the element
            if (top + tooltipRect.height > window.innerHeight - margin) {
                top = containerRect.top - tooltipRect.height - 8;
            }
            
            setPosition({ top, left });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
            
            return () => {
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible]);

    const handleMouseEnter = () => {
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        setIsVisible(!isVisible);
    };

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isVisible]);

    return (
        <>
            <div
                ref={containerRef}
                className={`relative inline-block cursor-help ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
            >
                <div className="flex items-center gap-1">
                    {children}
                    <InfoOutlinedIcon 
                        className="text-gray-400 dark:text-gray-500 opacity-60 hover:opacity-100 transition-opacity" 
                        sx={{ fontSize: 14 }} 
                    />
                </div>
            </div>
            
            {/* Portal-style tooltip */}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-w-xs"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                    }}
                >
                    <div className="whitespace-pre-line text-center">{content}</div>
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 rotate-45"></div>
                </div>
            )}
        </>
    );
}
