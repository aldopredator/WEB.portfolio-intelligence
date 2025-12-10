import EditPortfolioClient from './EditPortfolioClient';

export default function EditPortfolioPage({ params }: { params: { id: string } }) {
  return <EditPortfolioClient portfolioId={params.id} />;
}
