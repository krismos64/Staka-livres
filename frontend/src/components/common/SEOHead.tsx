import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Staka Éditions - Correction professionnelle de manuscrits | Service d'édition français",
  description = "Service de correction et édition professionnelle de manuscrits. 15 ans d'expertise, 1500+ auteurs accompagnés. Standard des grandes maisons d'édition françaises.",
  keywords = "correction manuscrit, édition livre, correcteur professionnel, autoédition, correction orthographe, relecture professionnelle",
  image = "https://livrestaka.fr/images/og-staka-editions.jpg",
  url = "https://livrestaka.fr/",
  type = 'website',
  publishedTime,
  modifiedTime,
  author = "Staka Éditions",
  structuredData
}) => {
  useEffect(() => {
    // Mise à jour du titre
    document.title = title;

    // Fonction utilitaire pour mettre à jour ou créer des meta tags
    const updateMetaTag = (selector: string, content: string) => {
      let metaTag = document.querySelector(selector);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        if (selector.includes('property=')) {
          const property = selector.match(/property="([^"]+)"/)?.[1];
          if (property) metaTag.setAttribute('property', property);
        } else if (selector.includes('name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) metaTag.setAttribute('name', name);
        }
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };

    // Meta tags de base
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[name="keywords"]', keywords);
    updateMetaTag('meta[name="author"]', author);

    // Open Graph
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:url"]', url);
    updateMetaTag('meta[property="og:type"]', type);

    // Twitter Cards
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', image);

    // Articles spécifiques
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('meta[property="article:published_time"]', publishedTime);
      }
      if (modifiedTime) {
        updateMetaTag('meta[property="article:modified_time"]', modifiedTime);
      }
      updateMetaTag('meta[property="article:author"]', author);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', url);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', url);
      document.head.appendChild(canonicalLink);
    }

    // Données structurées
    if (structuredData) {
      const scriptId = 'structured-data';
      let existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function pour éviter l'accumulation de scripts
    return () => {
      if (structuredData) {
        const script = document.getElementById('structured-data');
        if (script) script.remove();
      }
    };
  }, [title, description, keywords, image, url, type, publishedTime, modifiedTime, author, structuredData]);

  return null; // Ce composant ne rend rien visuellement
};

export default SEOHead;