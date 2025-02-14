require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
const http = require("http");
const fileUpload = require("express-fileupload");


// API routes
const apiAuth = require('./routes/api/auth');
const apiDepartment = require('./routes/api/department');
const apiEmployee = require('./routes/api/employee');
const apiPosition = require('./routes/api/position');
const apiUserStatus = require('./routes/api/userStatus');
const apiQrCode = require('./routes/api/scanAttendance')
const apiRequestTimeoff = require('./routes/api/request_timeoff');
const apiGenerateCard = require('./routes/api/generateCard');
const apiNotification = require("./routes/api/notification");
const apiEmpType = require('./routes/api/employeeType');
const apiAttendanceTrack = require('./routes/api/attendanceTrack');
const apiProfile = require('./routes/api/profile');
const apiManualAttendance = require('./routes/api/manualAttendance');
const apiPayroll = require('./routes/api/payroll');
const apiAnnouncement = require("./routes/api/announcement")
const apiPersonalAttendance = require('./routes/api/personalAttendance');
const apiOvertime = require('./routes/api/overtime');
const apiRemainLeaveDays = require('./routes/api/remainLeaveDays');


// WEB routes
const webAuth = require("./routes/web/auth");
const webStaff = require("./routes/web/staff");
const webAdmin = require("./routes/web/admin");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your client's origin
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle users joining their personal notification room
  socket.on("join_user_room", (userId) => {
    if (userId) {
      const userRoom = `user_${userId}`;
      socket.join(userRoom);
      console.log(`User ${userId} joined room: ${userRoom}`);
    } else {
      console.error("join_user_room event received without a userId.");
    }
  });

  // Handle staff joining the 'staff' room (for general announcements)
  socket.on("join_staff", () => {
    socket.join("staff");
    console.log(`Staff member joined staff room: ${socket.id}`);
  });

  // Handle admins joining the 'admins' room (for admin-specific announcements)
  socket.on("join_admins", () => {
    socket.join("admins");
    console.log(`Admin joined admins room: ${socket.id}`);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});


app.set("io", io);


// Middleware setup
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // to parse JSON request bodies
app.use(fileUpload());

// API routes
app.use('/api', apiAuth); // Prefix all API routes with '/api'
app.use('/api', apiDepartment);
app.use('/api', apiEmployee);
app.use("/api", apiPosition);
app.use("/api", apiUserStatus);
app.use("/api", apiQrCode);
app.use("/api", apiRequestTimeoff);
app.use("/api", apiGenerateCard);
app.use("/api", apiNotification);
app.use("/api", apiEmpType);
app.use("/api", apiAttendanceTrack);
app.use("/api", apiProfile);
app.use("/api", apiManualAttendance);
app.use("/api", apiPayroll);
app.use("/api", apiAnnouncement);
app.use("/api", apiPersonalAttendance);
app.use("/api", apiOvertime);
app.use("/api", apiRemainLeaveDays);


// WEB routes
app.use(webAuth);
app.use(webStaff);
app.use(webAdmin);


// Server Listener
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
