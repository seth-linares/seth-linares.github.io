// src/components/prompt_generator/FileUploader.tsx

import useFileUploader from "@/hooks/prompt_generator/useFileUploader";
import useFileContext from "@/hooks/prompt_generator/useFileContext";
import { FiUpload, FiX, FiFile } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";

function FileUploader() {
    const { files, removeFile } = useFileContext();
    
    const {
        isLoading,
        error,
        selectFiles,
        reset,
    } = useFileUploader();

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button
                    type="button"
                    className="btn btn-secondary flex-1 gap-2 btn-animated"
                    onClick={selectFiles}
                >
                    <FiUpload className="w-5 h-5" />
                    Upload Files
                </button>
                {files.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-square btn-error btn-animated"
                        onClick={reset}
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, maxHeight: 0 }}
                        animate={{ opacity: 1, maxHeight: 400 }}
                        exit={{ opacity: 0, maxHeight: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="bg-base-200 rounded-lg p-4">
                            <div className="text-sm font-medium mb-2">
                                Uploaded Files ({files.length}):
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
                                {files.map((file: File, index: number) => (
                                    <motion.div
                                        key={`${file.name}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-base-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-sm">
                                            <FiFile className="w-4 h-4 text-secondary" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <button
                                            className="btn btn-accent btn-xs btn-soft btn-animated opacity-50 hover:opacity-100"
                                            onClick={() => removeFile(index)}
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="text-error text-sm">
                    Error: {error.message}
                </div>
            )}

            {isLoading && (
                <div className="loading loading-spinner loading-sm text-secondary" />
            )}
        </div>
    );
}

export default FileUploader;