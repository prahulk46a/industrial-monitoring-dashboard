# Industrial Monitoring System - Layered Architecture

## 📋 Project Overview

This is a comprehensive Node.js/Express-based industrial monitoring system built with a clean **3-layer architecture** (Controller-Service-Repository) for monitoring digital/analog inputs and outputs, with intelligent alarm management.

## 🏗️ Architecture Structure

```
industrial-monitoring/
├── src/
│   ├── config/                    # Configuration Layer
│   │   ├── database.js            # Database pool configuration
│   │   ├── environment.js         # Environment variables
│   │   └── constants.js           # App-wide constants & tag definitions
│   │
│   ├── layers/
│   │   ├── controller/            # Controller Layer (HTTP Request Handlers)
│   │   │   └── alarmController.js
│   │   │
│   │   ├── service/               # Service Layer (Business Logic)
│   │   │   └── alarmService.js
│   │   │
│   │   ├── repository/            # Repository Layer (Data Access)
│   │   │   └── alarmRepository.js
│   │   │
│   │   └── model/                 # Data Models (Future)
│   │
│   ├── routes/                    # API Routes
│   │   ├── digitalInputRoutes.js
│   │   ├── digitalOutputRoutes.js
│   │   ├── analogInputRoutes.js
│   │   ├── analogOutputRoutes.js
│   │   └── alarmRoutes.js
│   │
│   ├── middleware/                # Express Middleware
│   │   ├── errorHandler.js        # Error handling
│   │   └── responseHandler.js     # Standardized API responses
│   │
│   ├── utils/                     # Utility Functions
│   │   ├── alarmTracker.js        # Alarm state management
│   │   ├── alarmDescriptionGenerator.js
│   │   ├── dataGenerator.js       # Test data generation
│   │   └── helpers.js             # Common helper functions
│   │
│   ├── scheduler/                 # Background Jobs
│   │   └── dataPublisher.js       # Periodic data generation & publishing
│   │
│   └── app.js                     # Express app configuration
│
├── server.js                      # Server entry point
├── package.json
├── .env                           # Environment variables
└── README.md
```

## 🔄 Data Flow & Architecture Layers

### 1. **Controller Layer** (HTTP Request Handler)
- **Location**: `src/layers/controller/`
- **Responsibility**: Handle HTTP requests/responses
- **Example**: `alarmController.js` receives API calls and delegates to services
- **Pattern**: 
  ```javascript
  try {
    const result = await service.getData(params);
    apiResponse(res, 200, "Success", result);
  } catch (error) {
    next(error);
  }
  ```

### 2. **Service Layer** (Business Logic)
- **Location**: `src/layers/service/`
- **Responsibility**: Implement business rules and validation
- **Example**: `alarmService.js` validates alarm existence before updating
- **Pattern**:
  ```javascript
  async getAlarmById(alarmId) {
    const alarm = await repository.getById(alarmId);
    if (!alarm) throw { statusCode: 404, message: 'Not found' };
    return alarm;
  }
  ```

### 3. **Repository Layer** (Data Access)
- **Location**: `src/layers/repository/`
- **Responsibility**: All database operations
- **Example**: `alarmRepository.js` handles all DB queries
- **Pattern**:
  ```javascript
  async getAlarmById(alarmId) {
    const [rows] = await connection.execute('SELECT * FROM alarms WHERE id = ?', [alarmId]);
    return rows[0];
  }
  ```

## 📊 Available Endpoints

### Digital Inputs
```
GET /api/digital-inputs/readings?limit=8
GET /api/digital-inputs/tags
```

### Digital Outputs
```
GET /api/digital-outputs/readings?tagId=DO-001&limit=4
GET /api/digital-outputs/tags
```

### Analog Inputs
```
GET /api/analog-inputs/readings?status=HEALTHY&limit=10
GET /api/analog-inputs/tags
```

### Analog Outputs
```
GET /api/analog-outputs/readings?limit=1
GET /api/analog-outputs/tags
```

### Alarms
```
GET /api/alarms?status=ACTIVE&limit=10&offset=0
GET /api/alarms/:alarmId
GET /api/alarms/by-tag/:tagId?days=30&limit=50
GET /api/alarms/stats/summary?days=30
POST /api/alarms/:alarmId/acknowledge
POST /api/alarms/:alarmId/resolve
```

### Health Check
```
GET /api/health
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=industrialmonitoring
DB_CONNECTION_LIMIT=10
NODE_ENV=development
```

### 3. Start Server
```bash
npm start
# or
node server.js
```

## 📚 Key Components

### Config Layer
- **`constants.js`**: All tag definitions, alarm thresholds
- **`database.js`**: MySQL connection pool
- **`environment.js`**: Environment variable management

### Utils Layer
- **`alarmTracker.js`**: Manages alarm state and lifecycle
- **`dataGenerator.js`**: Generates realistic test data
- **`alarmDescriptionGenerator.js`**: Creates human-readable alarm messages
- **`helpers.js`**: Common utility functions (getAlarmLevel, generateAlarmId)

### Scheduler
- **`dataPublisher.js`**: 
  - Publishes simulated sensor data every 30 seconds
  - Manages alarm detection and storage
  - Initializes database with tag definitions

## 🔌 Database Schema Requirements

The system expects these tables:
- `digital_input_readings`
- `digital_input_tags`
- `digital_output_readings`
- `digital_output_tags`
- `analog_input_readings`
- `analog_input_tags`
- `analog_output_readings`
- `analog_output_tags`
- `alarms` (Fields: id, tag_id, tag_type, priority, description, triggered_value, triggered_at, acknowledged_at, resolved_at, status, created_at)

## 🎯 Benefits of This Architecture

✅ **Separation of Concerns**: Each layer has a single responsibility
✅ **Testability**: Easy to unit test each layer independently
✅ **Maintainability**: Changes to database logic don't affect API logic
✅ **Scalability**: Easy to add new features without touching existing code
✅ **Reusability**: Services can be used by multiple controllers
✅ **Error Handling**: Centralized error handling middleware
✅ **Consistency**: Standardized response format across all endpoints

## 🔄 Request Flow Example

```
API Request
    ↓
Routes (alarmRoutes.js)
    ↓
Controller (alarmController.js) - HTTP handling
    ↓
Service (alarmService.js) - Business logic & validation
    ↓
Repository (alarmRepository.js) - Database operations
    ↓
MySQL Database
    ↓
Response Handler (responseHandler.js) - Format response
    ↓
API Response
```

## 🚨 Alarm System

### Alarm Lifecycle
1. **Detection**: Data Generator creates readings every 30 seconds
2. **Tracking**: AlarmTracker monitors for threshold breaches
3. **Creation**: New alarms are created and stored in database
4. **Acknowledgment**: Users can acknowledge alarms via API
5. **Resolution**: Alarms can be resolved when conditions normalize

### Alarm Thresholds
Configured in `src/config/constants.js`:
- Digital Inputs/Outputs: Trigger at value = 1
- Analog Inputs: MODERATE and CRITICAL thresholds

## 🛠️ Extending the System

### Adding a New Endpoint
1. Create Controller: `src/layers/controller/newController.js`
2. Create Service: `src/layers/service/newService.js`
3. Create Repository: `src/layers/repository/newRepository.js`
4. Create Routes: `src/routes/newRoutes.js`
5. Add to `src/app.js`: `app.use('/api/new', newRoutes);`

### Adding a New Alarm Rule
1. Update `ALARM_THRESHOLDS` in `src/config/constants.js`
2. Update `alarmTracker.js` if custom logic needed
3. Test via API endpoints

## 📝 Environment Variables

```env
PORT                    # Server port (default: 3000)
NODE_ENV               # development/production
DB_HOST               # Database host
DB_USER               # Database user
DB_PASSWORD           # Database password
DB_NAME               # Database name
DB_CONNECTION_LIMIT   # Connection pool size (default: 10)
LOG_LEVEL             # Logging level (default: info)
```

## 🐛 Troubleshooting

**Database Connection Error**
- Verify MySQL is running
- Check credentials in `.env`

**Alarms Not Creating**
- Check database has `alarms` table with correct schema
- Verify threshold values in constants.js

**Data Not Publishing**
- Check scheduler interval in `dataPublisher.startScheduler()`
- Verify database connection is active

## 📦 Dependencies

```json
{
  "express": "^4.x",
  "mysql2": "^2.x",
  "cors": "^2.x",
  "body-parser": "^1.x",
  "dotenv": "^16.x"
}
```

## 🎓 Learning Resources

This architecture demonstrates:
- **MVC Pattern**: Clean separation between layers
- **Repository Pattern**: Abstraction of data access
- **Dependency Injection**: Service dependencies
- **Middleware Pattern**: Express middleware pipeline
- **Error Handling**: Centralized error management
- **Asynchronous Programming**: Promises and async/await
- **Database Pooling**: MySQL connection management

---

**Version**: 1.0.0  
**Last Updated**: January 2, 2026
