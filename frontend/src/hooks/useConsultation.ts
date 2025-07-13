import { useMutation } from '@tanstack/react-query';

interface ConsultationBookingData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  message?: string;
  requestedDateTime: string;
  source: 'landing_page' | 'client_space';
}

interface ConsultationBookingResponse {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    requestedDateTime: string;
  };
}

const bookConsultation = async (data: ConsultationBookingData): Promise<ConsultationBookingResponse> => {
  const response = await fetch('/api/consultations/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur lors de la réservation');
  }

  return response.json();
};

export const useBookConsultation = () => {
  return useMutation({
    mutationFn: bookConsultation,
    onError: (error) => {
      console.error('Erreur lors de la réservation de consultation:', error);
    }
  });
};

// Hook pour récupérer les créneaux disponibles
export const useAvailableSlots = () => {
  const getAvailableSlots = async (date?: string) => {
    const url = date ? `/api/consultations/available-slots?date=${date}` : '/api/consultations/available-slots';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des créneaux');
    }
    
    return response.json();
  };

  return { getAvailableSlots };
};