// src/hooks/useRegisterAction.ts

import { useEffect } from 'react';

function useRegisterAction(
  eventName,
  handler,
  setState
) {
  useEffect(() => {
    const eventListener = (event) => {
      try {
        const newState = handler(event);
        
        if (newState){
          setState(newState);
        } else{
          console.log('No updates')
        }
        
      } catch (error) {
        console.error(`Error handling event '${eventName}':`, error);
      }
    };

    window.addEventListener(eventName, eventListener);

    // Cleanup function
    return () => {
      window.removeEventListener(eventName, eventListener);
    };
  }, [eventName, handler, setState]);
}

export default useRegisterAction;