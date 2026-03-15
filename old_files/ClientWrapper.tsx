'use client';

import React from 'react';
import LayoutClient from './LayoutClient';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return <LayoutClient>{children}</LayoutClient>;
}
