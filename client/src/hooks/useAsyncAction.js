import { useState, useCallback } from "react";

export const useAsyncAction = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (actionFn) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await actionFn();
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (err) {
      setIsSubmitting(false);
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  return {
    run,
    isSubmitting,
    error,
    setError,
  };
};

export default useAsyncAction;
