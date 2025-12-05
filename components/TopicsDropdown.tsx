"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";

interface Topic {
    id: number;
    name: string;
}

interface TopicsDropdownProps {
    onTopicSelect: (topic: string) => void;
    topics: Topic[];
    setTopics: (topics: Topic[]) => void;
    disableAddingTopics?: boolean; // Nueva prop para deshabilitar la adición de tópicos
    selectedTopic?: string; // Prop para el tópico seleccionado
}

export function TopicsDropdown({ onTopicSelect, topics, setTopics, disableAddingTopics = false, selectedTopic = "" }: TopicsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newTopic, setNewTopic] = useState("");
    const [addingTopic, setAddingTopic] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const selectTopic = (topic: string) => {
        onTopicSelect(topic);
        setIsOpen(false);
    };

    const addNewTopic = () => {
        if (!newTopic.trim()) {
            return;
        }

        // Verificar si ya existe un tópico con este nombre
        const exists = topics.some(t => t.name.toLowerCase() === newTopic.trim().toLowerCase());
        if (exists) {
            alert("Este tópico ya existe");
            return;
        }

        const newTopicObj = {
            id: topics.length > 0 ? Math.max(...topics.map(t => t.id)) + 1 : 1,
            name: newTopic.trim()
        };

        const updatedTopics = [...topics, newTopicObj];
        setTopics(updatedTopics);
        onTopicSelect(newTopic.trim());
        setNewTopic("");
        setAddingTopic(false);
        setIsOpen(false);
    };

    return (
        <div className="relative mb-4">
            <div
                className="bg-white border border-slate-200 rounded-xl p-3 cursor-pointer flex justify-between items-center hover:border-slate-300 transition-colors"
                onClick={toggleDropdown}
            >
                <span className="text-slate-700">
                    {selectedTopic || "Select Topic"}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <ul className="py-1">
                        {topics.map((topic) => (
                            <li
                                key={topic.id}
                                className={`px-4 py-2 cursor-pointer transition-colors ${selectedTopic === topic.name 
                                    ? 'bg-sky-50 text-sky-700' 
                                    : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                onClick={() => selectTopic(topic.name)}
                            >
                                {topic.name}
                            </li>
                        ))}

                        {!disableAddingTopics && (
                            <>
                                {!addingTopic && (
                                    <li
                                        className="px-4 py-2 cursor-pointer hover:bg-slate-50 text-sky-600 flex items-center border-t border-slate-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAddingTopic(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> New Topic
                                    </li>
                                )}

                                {addingTopic && (
                                    <li className="px-3 py-2 flex items-center gap-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={newTopic}
                                            onChange={(e) => setNewTopic(e.target.value)}
                                            className="bg-white border border-slate-200 text-slate-900 p-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                            placeholder="New topic"
                                            autoFocus
                                        />
                                        <Button
                                            onClick={addNewTopic}
                                            className="text-xs py-2 px-3 h-auto bg-slate-900 text-white hover:bg-slate-800 rounded-lg"
                                        >
                                            Add
                                        </Button>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}