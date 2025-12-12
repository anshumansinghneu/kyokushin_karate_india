import api from '@/lib/api';

export interface ChatbotConfig {
  welcomeMessage: string;
  fallbackMessage: string;
  errorMessage: string;
  typingDelay: [number, number]; // [min, max] in milliseconds
}

interface Location {
  city: string;
  state: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  location?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
}

export const chatbotConfig: ChatbotConfig = {
  welcomeMessage: "Osu! Welcome to Kyokushin Karate India! I'm here to help you with any questions about our training, dojos, events, or philosophy. How can I assist you today?",
  fallbackMessage: "I understand you're asking about Kyokushin Karate. Could you please be more specific? I can help you with information about training, dojos, events, belt rankings, membership, or our philosophy. You can also visit our website or contact us directly for detailed information.",
  errorMessage: "I'm experiencing some technical difficulties right now. Please try again later or contact us directly at admin@kyokushin.in for assistance.",
  typingDelay: [1000, 3000]
};

export interface DynamicResponse {
  type: 'static' | 'dynamic' | 'hybrid';
  response?: string;
  apiCall?: () => Promise<string>;
  fallback?: string;
}

// Enhanced response system with dynamic data fetching
export class ChatbotResponseSystem {
  private static async fetchDojos(): Promise<string> {
    try {
      const response = await api.get('/dojos/locations');
      const locations: Location[] = response.data.data.locations;
      
      if (locations.length > 0) {
        const locationList = locations
          .map((loc: Location) => `${loc.city}, ${loc.state}`)
          .slice(0, 5)
          .join(', ');
        
        return `We have dojos in the following locations: ${locationList}. Visit our dojos page for complete details and contact information for each location.`;
      }
      
      return "We have multiple dojos across India. Please visit our dojos page for complete location details and contact information.";
    } catch {
      return "We have dojos in major Indian cities including Delhi, Mumbai, Bangalore, Chennai, and Guwahati. Please check our dojos page for detailed information.";
    }
  }

  private static async fetchUpcomingEvents(): Promise<string> {
    try {
      const response = await api.get('/events');
      const events: Event[] = response.data.data.events
        .filter((event: Event) => new Date(event.startDate) > new Date())
        .slice(0, 3);
      
      if (events.length > 0) {
        const eventList = events
          .map((event: Event) => `${event.title} (${new Date(event.startDate).toLocaleDateString()})`)
          .join(', ');
        
        return `Here are our upcoming events: ${eventList}. Visit our events page to register and see complete details.`;
      }
      
      return "We regularly organize tournaments, seminars, belt gradings, and training camps. Please check our events page for the latest schedule.";
    } catch {
      return "We regularly organize tournaments, seminars, belt gradings, and training camps. Please check our events page for upcoming activities.";
    }
  }

  private static async fetchRecentNews(): Promise<string> {
    try {
      const response = await api.get('/posts?type=BLOG');
      const posts: Post[] = response.data.data.posts?.slice(0, 2) || [];
      
      if (posts.length > 0) {
        const postTitles = posts.map((post: Post) => post.title).join(', ');
        return `Check out our latest articles: ${postTitles}. Visit our news section for more updates and insights.`;
      }
      
      return "Stay updated with our latest news and articles on training techniques, philosophy, and event coverage. Visit our news section for more.";
    } catch {
      return "We regularly publish articles about training techniques, philosophy, and event coverage. Please visit our news section for the latest updates.";
    }
  }

  public static getResponse(userMessage: string): DynamicResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Dynamic responses with API calls
    if (lowerMessage.includes('dojo') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return {
        type: 'dynamic',
        apiCall: this.fetchDojos,
        fallback: "We have dojos in major Indian cities including Delhi, Mumbai, Bangalore, Chennai, and Guwahati. Please check our dojos page for detailed information."
      };
    }

    if (lowerMessage.includes('event') || lowerMessage.includes('tournament') || lowerMessage.includes('competition')) {
      return {
        type: 'dynamic',
        apiCall: this.fetchUpcomingEvents,
        fallback: "We regularly organize tournaments, seminars, belt gradings, and training camps. Please check our events page for upcoming activities."
      };
    }

    if (lowerMessage.includes('news') || lowerMessage.includes('article') || lowerMessage.includes('blog')) {
      return {
        type: 'dynamic',
        apiCall: this.fetchRecentNews,
        fallback: "We regularly publish articles about training techniques, philosophy, and event coverage. Please visit our news section for the latest updates."
      };
    }

    // Static responses for common queries
    if (/^(hi|hello|hey|osu|greetings|good (morning|afternoon|evening))/i.test(userMessage)) {
      return {
        type: 'static',
        response: "Osu! Welcome to Kyokushin Karate India! How can I help you today?"
      };
    }

    if (/(what is|about|tell me about|explain) (kyokushin|karate|martial art)/i.test(userMessage)) {
      return {
        type: 'static',
        response: "Kyokushin Karate is a full-contact martial art founded by Mas Oyama. It emphasizes physical conditioning, discipline, and the warrior spirit. Our organization promotes traditional Kyokushin training across India with authentic techniques and philosophy."
      };
    }

    if (/(training|practice|classes|how to train|what do you learn)/i.test(userMessage)) {
      return {
        type: 'static',
        response: "Our training includes kata (forms), kihon (basics), kumite (sparring), and physical conditioning. We focus on developing both physical strength and mental discipline. Each class builds your technique and fighting spirit through structured progression."
      };
    }

    if (/(belt|ranking|grading|promotion|dan|kyu)/i.test(userMessage)) {
      return {
        type: 'static',
        response: "Our belt system follows traditional Kyokushin ranking: White → Orange → Blue → Yellow → Green → Brown → Black. Each rank requires dedicated training, technique demonstration, and understanding of Kyokushin principles."
      };
    }

    if (/(join|member|register|enroll|sign up)/i.test(userMessage)) {
      return {
        type: 'static',
        response: "To become a member, you can register through our website or visit any of our dojos. We welcome practitioners of all levels, from complete beginners to experienced martial artists. Membership includes access to regular training, seminars, and events."
      };
    }

    if (/(philosophy|spirit|mindset|discipline|respect)/i.test(userMessage)) {
      return {
        type: 'static',
        response: "Kyokushin philosophy emphasizes perseverance, respect, discipline, and continuous self-improvement. We train not just the body, but also the mind and spirit. The Kyokushin motto: 'One thousand days of training for a beginner, ten thousand days for a master.'"
      };
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return {
        type: 'static',
        response: "You can contact us at admin@kyokushin.in or visit our contact page for dojo-specific information. Our admin team will be happy to help you with any questions!"
      };
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('time') || lowerMessage.includes('when')) {
      return {
        type: 'static',
        response: "Training schedules vary by dojo. Most dojos offer evening classes for adults and afternoon sessions for children. Please contact your local dojo for specific class timings and schedules."
      };
    }

    if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return {
        type: 'static',
        response: "Membership fees vary by location and training package. Please contact your nearest dojo for specific pricing information. We offer flexible payment options and family discounts."
      };
    }

    if (lowerMessage.includes('beginner') || lowerMessage.includes('start') || lowerMessage.includes('new')) {
      return {
        type: 'static',
        response: "Beginners are always welcome! No prior experience is needed. We'll start you with basic techniques and gradually build your skills. Come to any of our dojos for a trial class to experience authentic Kyokushin training!"
      };
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return {
        type: 'static',
        response: "You're welcome! Osu! Feel free to ask if you have any more questions about Kyokushin Karate. Train hard and stay strong!"
      };
    }

    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return {
        type: 'static',
        response: "Osu! Thank you for your interest in Kyokushin Karate India. Train hard and stay strong! See you in the dojo!"
      };
    }

    // Default fallback
    return {
      type: 'static',
      response: chatbotConfig.fallbackMessage
    };
  }
}