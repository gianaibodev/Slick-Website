import React from 'react'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  )
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-200 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-24 h-4 mb-2" />
      <Skeleton className="w-20 h-8 mb-2" />
      <Skeleton className="w-32 h-3" />
    </div>
  )
}

export const TableSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-lg border border-white/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex space-x-4">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-18 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
        {/* Rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="w-24 h-4 mb-1" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-16 h-6 rounded-full" />
            <div className="flex space-x-2">
              <Skeleton className="w-12 h-8 rounded" />
              <Skeleton className="w-12 h-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const MobileCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-white/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <Skeleton className="w-10 h-10 rounded-lg mr-3" />
          <div className="flex-1">
            <Skeleton className="w-24 h-4 mb-1" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Skeleton className="w-12 h-3 mb-1" />
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
        <div>
          <Skeleton className="w-12 h-3 mb-1" />
          <Skeleton className="w-12 h-4" />
        </div>
      </div>
      
      <div className="mb-3">
        <Skeleton className="w-12 h-3 mb-1" />
        <Skeleton className="w-16 h-4 mb-1" />
        <Skeleton className="w-20 h-3" />
      </div>
      
      <div className="flex space-x-3">
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="flex-1 h-8 rounded-lg" />
      </div>
    </div>
  )
}
