import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean | null; // null = not requested yet, true = granted, false = denied
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  onSuccess?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
  autoRequest?: boolean; // Default: true
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    onSuccess,
    onError,
    autoRequest = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false,
    hasPermission: null,
  });

  const mountedRef = useRef(true);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        hasPermission: false,
        error: 'Geolocation is not supported by your browser',
      }));
      // Note: onError is not called here because this is not a GeolocationPositionError
      // The error state is already set above, which is sufficient
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        
        const { latitude, longitude } = position.coords;
        
        // Validate coordinates (latitude: -90 to 90, longitude: -180 to 180)
        if (
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180 ||
          !isFinite(latitude) ||
          !isFinite(longitude)
        ) {
          console.warn('Geolocation: Invalid coordinates', { latitude, longitude });
          setState({
            latitude: null,
            longitude: null,
            error: 'Invalid location data',
            isLoading: false,
            hasPermission: true, // Permission was granted, but data is invalid
          });
          // Note: onError is not called here because this is not a GeolocationPositionError
          // The error state is already set above, which is sufficient
          return;
        }
        
        setState({
          latitude,
          longitude,
          error: null,
          isLoading: false,
          hasPermission: true,
        });
        onSuccess?.(position);
      },
      (error: GeolocationPositionError) => {
        if (!mountedRef.current) return;
        
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }

        // Log error to console (not shown to user per AC7)
        console.warn('Geolocation error:', errorMessage, error);

        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          isLoading: false,
          hasPermission: error.code === error.PERMISSION_DENIED ? false : null,
        });
        onError?.(error);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Auto-request on mount if enabled
    if (autoRequest) {
      requestLocation();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [requestLocation, autoRequest]);

  return {
    ...state,
    requestLocation,
  };
}

