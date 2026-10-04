// In-memory presence tracker: Map<userId, socketCount>
const userSocketCounts = new Map();

export const addPresence = (userId) => {
  const currentCount = userSocketCounts.get(userId) || 0;
  userSocketCounts.set(userId, currentCount + 1);
  return currentCount === 0; // True if transitioning from offline to online
};

export const removePresence = (userId) => {
  const currentCount = userSocketCounts.get(userId) || 0;
  if (currentCount <= 1) {
    userSocketCounts.delete(userId);
    return true; // True if transitioning from online to offline
  }
  userSocketCounts.set(userId, currentCount - 1);
  return false;
};

export const isUserOnline = (userId) => {
  return (userSocketCounts.get(userId) || 0) > 0;
};

export const getOnlineUserIds = () => {
  return Array.from(userSocketCounts.keys());
};

export const clearPresence = () => {
  userSocketCounts.clear();
};

export default {
  addPresence,
  removePresence,
  isUserOnline,
  getOnlineUserIds,
  clearPresence,
};
