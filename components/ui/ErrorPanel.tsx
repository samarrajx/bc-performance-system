import React from "react";

interface ValidationError {
    row?: number;
    message: string;
}

interface ErrorPanelProps {
    errors: ValidationError[];
    title?: string;
    className?: string;
}

export default function ErrorPanel({
    errors,
    title = "Validation Errors",
    className = ""
}: ErrorPanelProps) {
    if (!errors || errors.length === 0) return null;

    return (
        <div className={`rounded-xl border border-red-200 bg-red-50 p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3 text-red-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{title} ({errors.length})</span>
            </div>

            <div className="max-h-60 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {errors.slice(0, 50).map((err, index) => (
                    <div key={index} className="flex gap-3 text-sm text-red-700 bg-white/50 p-2 rounded">
                        {err.row && (
                            <span className="font-mono bg-red-100 px-2 py-0.5 rounded text-xs font-bold h-fit mt-0.5">
                                Row {err.row}
                            </span>
                        )}
                        <span>{err.message}</span>
                    </div>
                ))}
            </div>

            {errors.length > 50 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                    ... and {errors.length - 50} more errors.
                </p>
            )}
        </div>
    );
}
