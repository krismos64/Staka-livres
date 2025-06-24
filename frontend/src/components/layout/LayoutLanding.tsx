import React from "react";

interface LayoutLandingProps {
  children: React.ReactNode;
}

export default function LayoutLanding({ children }: LayoutLandingProps) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
