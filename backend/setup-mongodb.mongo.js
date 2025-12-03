// MongoDB Setup Script for Video Analyzer
// Run this with: mongosh video_analyzer setup-mongodb.mongo.js

// Create Organizations
db.organizations.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Test Company",
  description: "Test organization for development",
  settings: {
    maxStorageGB: 100,
    allowedVideoFormats: ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/x-matroska"],
    maxVideoSizeMB: 100
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.organizations.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439012"),
  name: "Demo Corp",
  description: "Demo organization for testing multi-tenancy",
  settings: {
    maxStorageGB: 50,
    allowedVideoFormats: ["video/mp4", "video/mpeg"],
    maxVideoSizeMB: 50
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create indexes
db.users.createIndex({ email: 1, orgId: 1 }, { unique: true });
db.users.createIndex({ orgId: 1 });

db.videos.createIndex({ orgId: 1, userId: 1 });
db.videos.createIndex({ orgId: 1, status: 1 });
db.videos.createIndex({ orgId: 1, createdAt: -1 });

db.organizations.createIndex({ name: 1 }, { unique: true });

print("✓ MongoDB setup complete!");
print("Organizations created:");
print("  - Test Company: 507f1f77bcf86cd799439011");
print("  - Demo Corp: 507f1f77bcf86cd799439012");
