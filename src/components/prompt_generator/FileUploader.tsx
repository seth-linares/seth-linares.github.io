// src/components/prompt_generator/FileUploader.tsx

import useFileUploader from "@/hooks/prompt_generator/useFileUploader";
import useFileContext from "@/hooks/prompt_generator/useFileContext";
import { FiUpload, FiX, FiFile } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import { ANIMATION_VARIANTS } from "@/utils/animations";
import AnimatedButton from "@/components/common/AnimatedButton";

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
                <AnimatedButton
                    type="button"
                    className="flex-1 gap-2"
                    onClick={selectFiles}
                    variant="secondary"
                >
                    <FiUpload className="w-5 h-5" />
                    Upload Files
                </AnimatedButton>
                {files.length > 0 && (
                    <AnimatedButton
                        type="button"
                        className="btn-square btn-error"
                        onClick={reset}
                    >
                        <FiX className="w-5 h-5" />
                    </AnimatedButton>
                )}
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
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
                                        <motion.button
                                            initial={{ opacity: 0.5 }}
                                            animate={{ opacity: 0.5 }}
                                            whileHover={ANIMATION_VARIANTS.buttonHover}
                                            whileTap={ANIMATION_VARIANTS.buttonTap}
                                            transition={{ duration: 0.1 }}
                                            className="btn btn-accent btn-xs btn-soft"
                                            onClick={() => removeFile(index)}
                                        >
                                            <FiX className="w-4 h-4" />
                                        </motion.button>
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