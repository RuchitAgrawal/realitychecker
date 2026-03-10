import type { ReactNode } from "react";
import React, { createContext, useContext, useState } from "react";

interface AccordionContextType {
    activeItems: string[];
    toggleItem: (id: string) => void;
    isItemActive: (id: string) => boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

const useAccordion = () => {
    const context = useContext(AccordionContext);
    if (!context) throw new Error("Accordion components must be used within an Accordion");
    return context;
};

interface AccordionProps {
    children: ReactNode;
    defaultOpen?: string;
    allowMultiple?: boolean;
    className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, defaultOpen, allowMultiple = false, className = "" }) => {
    const [activeItems, setActiveItems] = useState<string[]>(defaultOpen ? [defaultOpen] : []);

    const toggleItem = (id: string) => {
        setActiveItems(prev =>
            allowMultiple
                ? prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                : prev.includes(id) ? [] : [id]
        );
    };

    const isItemActive = (id: string) => activeItems.includes(id);

    return (
        <AccordionContext.Provider value={{ activeItems, toggleItem, isItemActive }}>
            <div className={`accordion ${className}`}>{children}</div>
        </AccordionContext.Provider>
    );
};

interface AccordionItemProps { id: string; children: ReactNode; className?: string; }

export const AccordionItem: React.FC<AccordionItemProps> = ({ id, children, className = "" }) => (
    <div className={`accordion-item ${className}`}>{children}</div>
);

interface AccordionHeaderProps {
    itemId: string;
    children: ReactNode;
    className?: string;
}

export const AccordionHeader: React.FC<AccordionHeaderProps> = ({ itemId, children, className = "" }) => {
    const { toggleItem, isItemActive } = useAccordion();
    const isActive = isItemActive(itemId);

    return (
        <button onClick={() => toggleItem(itemId)} className={`accordion-trigger ${className}`} type="button">
            <div style={{ flex: 1 }}>{children}</div>
            <svg
                className={`accordion-chevron ${isActive ? 'open' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );
};

interface AccordionContentProps { itemId: string; children: ReactNode; className?: string; }

export const AccordionContent: React.FC<AccordionContentProps> = ({ itemId, children, className = "" }) => {
    const { isItemActive } = useAccordion();
    const isActive = isItemActive(itemId);

    return (
        <div
            className={`accordion-content ${className}`}
            style={{ maxHeight: isActive ? '9999px' : 0, opacity: isActive ? 1 : 0 }}
        >
            <div className="accordion-content-inner">{children}</div>
        </div>
    );
};
