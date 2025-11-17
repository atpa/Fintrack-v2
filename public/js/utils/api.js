/**
 * Centralized API client for FinTrackr frontend
 * Provides unified request handling, error normalization, and helper methods.
 * Automatically includes credentials and content headers when needed.
 * @module api
 */

const DEFAULT_TIMEOUT = 12000; // 12s network timeout

/**
 * Normalize error object
 */
function normalizeError(err, response){
    const base = {
      ok: false,
      status: response ? response.status : 0,
      error: err && err.message ? err.message : 'Network error',
      details: null
    };
    if (response && !response.ok) {
      base.error = `Request failed (${response.status})`;
    }
    return base;
  }

  async function parseJsonSafe(resp){
    try { return await resp.json(); } catch { return null; }
  }

  /**
   * Core request wrapper
   */
  async function request(method, url, { data, headers, timeout = DEFAULT_TIMEOUT } = {}){
    const controller = new AbortController();
    const t = setTimeout(()=>controller.abort(), timeout);

    const opts = {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(data ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {})
      }
    };
    if (data) opts.body = JSON.stringify(data);

    let resp;
    try {
      resp = await fetch(url, opts);
    } catch (err){
      clearTimeout(t);
      return normalizeError(err, resp);
    }
    clearTimeout(t);

    if (resp.status === 401) {
      if (window.Auth && typeof Auth.handleUnauthorized === 'function') {
        try { await Auth.handleUnauthorized(); } catch(e) {}
      }
      return { ok:false, status:401, error:'Unauthorized' };
    }

    const payload = await parseJsonSafe(resp);
    if (!resp.ok) {
      return {
        ok:false,
        status: resp.status,
        error: (payload && (payload.error || payload.message)) || `HTTP ${resp.status}`,
        details: payload && payload.details ? payload.details : null
      };
    }

    return { ok:true, status: resp.status, data: payload };
  }

  const API = {
    get: (url, opts) => request('GET', url, opts),
    post: (url, data, opts) => request('POST', url, { ...(opts||{}), data }),
    put: (url, data, opts) => request('PUT', url, { ...(opts||{}), data }),
    patch: (url, data, opts) => request('PATCH', url, { ...(opts||{}), data }),
    delete: (url, opts) => request('DELETE', url, opts),

    /** Convenience helpers for common resources */
    accounts: {
      list(){ return API.get('/api/accounts'); },
      create(payload){ return API.post('/api/accounts', payload); },
      update(id, payload){ return API.put(`/api/accounts/${id}`, payload); },
      remove(id){ return API.delete(`/api/accounts/${id}`); }
    },
    categories: {
      list(){ return API.get('/api/categories'); },
      create(payload){ return API.post('/api/categories', payload); },
      update(id, payload){ return API.put(`/api/categories/${id}`, payload); },
      remove(id){ return API.delete(`/api/categories/${id}`); }
    },
    transactions: {
      list(){ return API.get('/api/transactions'); },
      remove(id){ return API.delete(`/api/transactions/${id}`); }
    }
  };

// Export API
export default API;
