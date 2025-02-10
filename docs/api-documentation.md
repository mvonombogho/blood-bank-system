# Blood Bank Management System API Documentation

## Base URL
```
/api
```

## Authentication
All API endpoints require authentication. Include the authentication token in the request header:
```
Authorization: Bearer {your-token}
```

## Endpoints

### Analytics

#### Get Dashboard Analytics
```http
GET /api/analytics
```

Returns comprehensive analytics data for the blood bank dashboard.

**Response**
```json
{
  "success": true,
  "data": {
    "totalDonors": 150,
    "totalRecipients": 120,
    "totalDonations": 200,
    "bloodInventory": [
      {
        "_id": "A+",
        "total": 50,
        "expiring": 5
      }
    ],
    "donationTrends": [
      {
        "date": "2025-01",
        "donations": 25
      }
    ]
  }
}
```

### Notifications

#### Get Active Notifications
```http
GET /api/notifications
```

Retrieves all active notifications sorted by severity and timestamp.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "type": "low_inventory",
      "severity": "high",
      "message": "Low inventory alert: A+ (5 units remaining)",
      "timestamp": "2025-02-10T07:00:00.000Z"
    }
  ]
}
```

#### Send Notification
```http
POST /api/notifications
```

Sends a notification to specified recipients.

**Request Body**
```json
{
  "notificationType": "low_inventory",
  "recipientEmail": "user@example.com",
  "message": "Blood type A+ is running low"
}
```

**Response**
```json
{
  "success": true,
  "message": "Notification sent successfully"
}
```

### Blood Inventory

#### Get Inventory Status
```http
GET /api/inventory
```

Returns current blood inventory levels.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "bloodType": "A+",
      "units": 50,
      "expiryDate": "2025-03-10T00:00:00.000Z",
      "location": "Storage-A"
    }
  ]
}
```

#### Update Inventory
```http
PUT /api/inventory/{id}
```

Updates inventory levels for a specific blood type.

**Request Body**
```json
{
  "units": 45,
  "location": "Storage-B"
}
```

### Donors

#### Get Donor List
```http
GET /api/donors
```

Retrieves list of registered donors.

**Query Parameters**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 10)
- `bloodType` (optional): Filter by blood type
- `status` (optional): Filter by donor status

**Response**
```json
{
  "success": true,
  "data": {
    "donors": [
      {
        "id": "123",
        "name": "John Doe",
        "bloodType": "A+",
        "lastDonationDate": "2025-01-15T00:00:00.000Z",
        "contactNumber": "+1234567890"
      }
    ],
    "total": 150,
    "page": 1,
    "pages": 15
  }
}
```

### Recipients

#### Get Recipients List
```http
GET /api/recipients
```

Retrieves list of registered recipients.

**Query Parameters**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 10)
- `bloodType` (optional): Filter by blood type

**Response**
```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "id": "456",
        "name": "Jane Smith",
        "bloodType": "B+",
        "lastTransfusionDate": "2025-01-20T00:00:00.000Z",
        "hospital": "City Hospital"
      }
    ],
    "total": 120,
    "page": 1,
    "pages": 12
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per minute per IP address. The following headers are included in the response:
- X-RateLimit-Limit: Maximum number of requests allowed per window
- X-RateLimit-Remaining: Number of requests remaining in current window
- X-RateLimit-Reset: Time when the rate limit resets