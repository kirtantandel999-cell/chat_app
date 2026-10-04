import { useState, useEffect } from "react";
import chatApi from "../api/chatApi";

export const useFileUrl = (fileId) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(fileId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileId) {
      setUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    let objectUrl = null;

    setLoading(true);
    setError(null);

    chatApi
      .fetchFileBlob(fileId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || err.message || "Failed to load file");
        setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  return { url, loading, error };
};

export default useFileUrl;
