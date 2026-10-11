import MateExperience from '@/components/mate/MateExperience';
/** Everyone enters the same cockpit; no session or saved perspective is required. */
export default function Home() {
  return <MateExperience development={process.env.NODE_ENV==='development'} />;
}
