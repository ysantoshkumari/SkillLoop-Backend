const express = require("express");
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET MY NOTIFICATIONS
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("request", "status")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
});

// MARK ONE NOTIFICATION AS READ
router.patch("/:id/read", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    res.json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    res.status(500).json({
      message: "Unable to update notification.",
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    res.status(500).json({
      message: "Unable to update notifications.",
    });
  }
});

module.exports = router;