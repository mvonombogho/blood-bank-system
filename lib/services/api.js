lib/services/api.js

// Generic fetch function with error handling
async function fetchApi(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Donor services
export const donorService = {
  getAll: () => fetchApi('/api/donors'),
  getById: (id) => fetchApi(`/api/donors/${id}`),
  create: (data) => fetchApi('/api/donors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/api/donors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/api/donors/${id}`, {
    method: 'DELETE',
  }),
};

// Inventory services
export const inventoryService = {
  getAll: () => fetchApi('/api/inventory'),
  getById: (id) => fetchApi(`/api/inventory/${id}`),
  create: (data) => fetchApi('/api/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/api/inventory/${id}`, {
    method: 'DELETE',
  }),
  checkAvailability: (bloodType) => 
    fetchApi(`/api/inventory/availability?bloodType=${bloodType}`),
};

// Recipient services
export const recipientService = {
  getAll: () => fetchApi('/api/recipients'),
  getById: (id) => fetchApi(`/api/recipients/${id}`),
  create: (data) => fetchApi('/api/recipients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/api/recipients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/api/recipients/${id}`, {
    method: 'DELETE',
  }),
};