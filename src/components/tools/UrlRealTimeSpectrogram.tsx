import ProfessionalSpectrogram from './ProfessionalSpectrogram';

type Props = {
  audioUrl: string | null;
};

export default function UrlRealTimeSpectrogram({ audioUrl }: Props) {
  return <ProfessionalSpectrogram audioUrl={audioUrl} width={800} />;
}
