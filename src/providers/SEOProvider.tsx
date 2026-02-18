import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

interface SEOProviderProps {
    children: React.ReactNode;
}

export function SEOProvider({ children }: SEOProviderProps) {
    return (
        <HelmetProvider>
            {children}
        </HelmetProvider>
    );
}
