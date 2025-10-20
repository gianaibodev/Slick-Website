// Simple in-memory cache for admin data
class AdminCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = 30000) { // 30 seconds default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Clear all admin-related cache entries
  clearAdmin() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('admin:')) {
        this.cache.delete(key)
      }
    }
  }
}

export const adminCache = new AdminCache()
