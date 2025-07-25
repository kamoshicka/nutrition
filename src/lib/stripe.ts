import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    let publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set, using placeholder');
      publishableKey = 'pk_test_placeholder';
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }
  
  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });
  
  if (error) {
    throw error;
  }
};