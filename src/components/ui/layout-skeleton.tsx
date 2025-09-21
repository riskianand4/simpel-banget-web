import React from 'react';
import { Skeleton } from './skeleton';

// Sidebar Skeleton
export const SidebarSkeleton = () => <div className="w-60 h-full border-r border-border bg-background p-4 space-y-4">
    {/* Logo area */}
    <div className="flex items-center space-x-3 mb-6">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-6 w-24" />
    </div>
    
    {/* Navigation groups */}
    <div className="space-y-6">
      {/* Main navigation */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-16 mb-3" />
        {Array.from({
        length: 5
      }).map((_, i) => <div key={i} className="flex items-center space-x-3 p-2 rounded-md">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-20" />
          </div>)}
      </div>
      
      {/* Admin section */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-12 mb-3" />
        {Array.from({
        length: 3
      }).map((_, i) => <div key={i} className="flex items-center space-x-3 p-2 rounded-md">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-16" />
          </div>)}
      </div>
      
      {/* More section */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-10 mb-3" />
        {Array.from({
        length: 2
      }).map((_, i) => <div key={i} className="flex items-center space-x-3 p-2 rounded-md">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-14" />
          </div>)}
      </div>
    </div>
    
    {/* User area at bottom */}
    <div className="absolute bottom-4 left-4 right-4">
      
    </div>
  </div>;

// Header Skeleton
export const HeaderSkeleton = () => <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6">
    {/* Left side - sidebar trigger */}
    <div className="flex items-center space-x-4">
      <Skeleton className="h-6 w-6 rounded" />
    </div>
    
    {/* Right side - actions */}
    <div className="flex items-center space-x-2">
      {/* Search bar */}
      <Skeleton className="h-9 w-40 rounded-md" />
      
      {/* Action buttons */}
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </header>;

// Content Skeleton
export const ContentSkeleton = () => <main className="flex-1 p-6 space-y-6">
    {/* Page header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({
      length: 4
    }).map((_, i) => <div key={i} className="border rounded-lg p-6 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>)}
    </div>
    
    {/* Main content area */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Chart area */}
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-64 w-full rounded" />
          </div>
        </div>
        
        {/* Table area */}
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="space-y-3">
              {/* Table header */}
              <div className="flex space-x-4 pb-2 border-b">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              {/* Table rows */}
              {Array.from({
              length: 5
            }).map((_, i) => <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right column - sidebar content */}
      <div className="space-y-6">
        {/* Activity feed */}
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            {Array.from({
            length: 4
          }).map((_, i) => <div key={i} className="flex space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>)}
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-28" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({
              length: 4
            }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>;

// Mobile Layout Skeleton
export const MobileLayoutSkeleton = () => <div className="min-h-screen flex flex-col w-full bg-background pb-16">
    {/* Mobile Header */}
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-3">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-6 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-1">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
      </div>
    </header>
    
    {/* Mobile Content */}
    <main className="flex-1 p-2 space-y-4">
      {/* Mobile stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({
        length: 4
      }).map((_, i) => <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-2 w-16" />
          </div>)}
      </div>
      
      {/* Mobile content cards */}
      <div className="space-y-4">
        {Array.from({
        length: 3
      }).map((_, i) => <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-32 w-full rounded" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>)}
      </div>
    </main>
    
    {/* Mobile Bottom Navigation */}
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border">
      <div className="flex items-center justify-around h-full px-2">
        {Array.from({
        length: 5
      }).map((_, i) => <div key={i} className="flex flex-col items-center space-y-1">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-2 w-8" />
          </div>)}
      </div>
    </div>
  </div>;

// Complete Layout Skeleton
export const LayoutSkeleton = ({
  isMobile = false
}: {
  isMobile?: boolean;
}) => {
  if (isMobile) {
    return <MobileLayoutSkeleton />;
  }
  return <div className="min-h-screen flex w-full bg-background">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />
        <ContentSkeleton />
      </div>
    </div>;
};
export default LayoutSkeleton;