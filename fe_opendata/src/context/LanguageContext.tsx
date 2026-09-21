'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ES' | 'EN' | 'QU';

export interface LanguageOption {
  code: Language;
  label: string;
  name: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'ES', label: 'ES', name: 'Español' },
  { code: 'EN', label: 'EN', name: 'English' },
  { code: 'QU', label: 'QU', name: 'Runasimi' },
];

export const translations = {
  ES: {
    // Navbar
    'nav.inicio': 'Inicio',
    'nav.turismo': 'Turismo',
    'nav.busquedaAvanzada': 'Búsqueda Avanzada',
    'nav.buscar': 'Buscar',
    'nav.portalNacional': 'Portal Nacional de Turismo',
    'nav.selectLang': 'Idioma / Language',

    // Search Modal
    'search.modalTitle': 'Buscar Recursos Turísticos',
    'search.placeholder': 'Escribe el nombre del destino, departamento, provincia...',
    'search.popular': 'Búsquedas populares:',
    'search.popular1': 'Machu Picchu',
    'search.popular2': 'Lago Titicaca',
    'search.popular3': 'Cañón del Colca',
    'search.popular4': 'Kuelap',
    'search.popular5': 'Huacachina',
    'search.pressEnter': 'Presiona Enter para buscar en el catálogo nacional',
    'search.close': 'Cerrar',
    'search.exploreAll': 'Ver todos los resultados',

    // Home Page - Hero
    'hero.title1': 'Descubre los Recursos Turísticos del',
    'hero.titlePeru': 'Perú',
    'hero.subtitle': 'Explora las maravillas arqueológicas, sitios naturales, rutas oficiales y patrimonio de las 25 regiones con datos técnicos verificados en tiempo real.',
    'hero.btnExplore': 'Explorar Recursos',

    // Home Page - Advantages
    'home.advantagesBadge': 'Ventajas de la Plataforma',
    'home.whyChoose': '¿Por Qué Elegir',
    'home.whyChooseDesc': 'Somos el visualizador de datos abiertos y georreferenciación turística más intuitivo del país. Conectamos a ciudadanos, viajeros, estudiantes, investigadores y operadores con información 100% oficial de manera rápida, limpia y sin fricciones.',
    'home.feat1Title': 'Datos 100% Oficiales',
    'home.feat1Desc': 'Información técnica y fotográfica sincronizada directamente con el inventario del MINCETUR sin manipulación.',
    'home.feat2Title': 'Acceso Libre y Seguro',
    'home.feat2Desc': 'Consulta ilimitada sin registros obligatorios, sin recopilación de datos personales ni rastreo publicitario.',
    'home.feat3Title': 'Rutas e Itinerarios',
    'home.feat3Desc': 'Detalle paso a paso para llegar a cada destino con medios de transporte, tipos de vía y tiempos estimados.',
    'home.feat4Title': 'Búsqueda Inteligente',
    'home.feat4Desc': 'Filtros dinámicos por región, categoría, actividad o código único de ficha para encontrar tu destino al instante.',

    // Home Page - Metrics
    'home.metricAttractions': 'Atractivos',
    'home.metricRegions': 'Regiones',
    'home.metricOpen': 'Abierto',

    // Home Page - CTA
    'home.ctaTitle': '¿Listo para Explorar el Perú?',
    'home.ctaDesc': 'Accede al catálogo completo de OpenData con más de 5,000 atractivos turísticos georreferenciados, fotos oficiales y videos en vivo.',
    'home.ctaBtn': 'Explorar el Catálogo Ahora',

    // Turismo Page
    'turismo.badge': 'Módulo de Exploración y Búsqueda Turística',
    'turismo.title': 'Catálogo de',
    'turismo.titleHighlight': 'Recursos Turísticos',
    'turismo.subtitle': 'Consulta, filtra y localiza más de 5,000 atractivos georreferenciados en todo el territorio peruano.',
    'turismo.searchPlaceholder': 'Buscar por nombre o palabra clave (ej: Machu Picchu, Colca, Lago Titicaca...)',
    'turismo.btnAdvanced': 'Avanzado (Código)',
    'turismo.btnSearch': 'Buscar',
    'turismo.filterRegion': 'Región / Departamento',
    'turismo.allRegions': 'Todas las regiones (25)',
    'turismo.filterCategory': 'Categoría',
    'turismo.allCategories': 'Todas las categorías',
    'turismo.filterActivity': 'Actividad',
    'turismo.allActivities': 'Todas las actividades',
    'turismo.advancedTitle': 'Búsqueda Avanzada por Código Oficial de Ficha',
    'turismo.advancedPlaceholder': 'Ingresa el número de ficha (ej: 62, 154, 820, 7482...)',
    'turismo.advancedDesc': 'Búsqueda directa por el identificador numérico único registrado en el inventario.',
    'turismo.removeCode': 'Quitar código',
    'turismo.filtersApplied': 'Filtros aplicados en la búsqueda actual',
    'turismo.filtersReady': 'Filtros seleccionados listos para buscar',
    'turismo.clearFilters': 'Limpiar todos los filtros',
    'turismo.sectionBadge': 'Exploración Abierta',
    'turismo.allResources': 'Todos los Recursos Turísticos Registrados',
    'turismo.resourcesIn': 'Recursos en',
    'turismo.codeSearch': 'Ficha con Código N°',
    'turismo.resultsFor': 'Resultados para',
    'turismo.foundCount': 'atractivos encontrados',
    'turismo.reset': 'Restablecer',
    'turismo.loading': 'Consultando base de datos abierta...',
    'turismo.noResults': 'No se encontraron atractivos turísticos',
    'turismo.noResultsDesc': 'Intenta ajustar los criterios de búsqueda, cambiar de departamento o borrar los filtros aplicados.',
    'turismo.viewSheet': 'Ver Ficha',
    'turismo.inventory': 'Inventario',

    // Footer
    'footer.desc': 'Plataforma nacional de datos abiertos para la consulta, georreferenciación y exploración interactiva de los recursos y atractivos turísticos del Perú.',
    'footer.connect': 'Conéctate con Nosotros',
    'footer.nav': 'Navegación',
    'footer.navHome': 'Inicio (Portal General)',
    'footer.navTurismo': 'Turismo y Explorador',
    'footer.navMap': 'Mapa de Regiones',
    'footer.navCatalog': 'Catálogo Georreferenciado',
    'footer.dataApi': 'Datos Abiertos & API',
    'footer.transparency': 'Transparencia',
    'footer.terms': 'Términos y Condiciones',
    'footer.privacy': 'Políticas de Privacidad',
    'footer.license': 'Licencia de Datos Abiertos',
    'footer.claims': 'Libro de Reclamaciones',
    'footer.faq': 'Preguntas Frecuentes (FAQ)',
    'footer.rights': 'Repositorio Nacional de Datos de Turismo del Perú',
    // Card
    'card.loadingPhoto': 'Cargando fotografía oficial...',
    'card.noPhoto': 'Sin fotografía digitalizada en ficha oficial',
    'card.recordNum': 'Ficha',
    'card.inventoryTitle': 'Inventario Turístico Nacional',
    'card.touristResource': 'Recurso Turístico',
    'card.themeMuseum': 'Museo y Exposición',
    'card.themeCultural': 'Patrimonio Cultural',
    'card.themeWater': 'Cuerpo de Agua / Costa',
    'card.themeNature': 'Formación Natural',
    'card.themeGeneral': 'Recurso Turístico',

    // Ficha Detail Page
    'ficha.breadcrumbHome': 'Inicio',
    'ficha.breadcrumbTurismo': 'Turismo',
    'ficha.backToCatalog': 'Volver al Catálogo',
    'ficha.sourceFile': 'Ficha Fuente',
    'ficha.loading': 'Cargando información oficial del recurso...',
    'ficha.notFound': 'Esta ficha no existe o ha sido dada de baja del inventario oficial.',
    'ficha.notFoundDesc': 'El recurso solicitado no se encuentra publicado o no está registrado en el inventario oficial.',
    'ficha.exploreOther': 'Explorar otros destinos oficiales',
    'ficha.officialPhoto': 'Fotografía Oficial del Recurso',
    'ficha.officialGallery': 'Galería Oficial',
    'ficha.photos': 'fotos',
    'ficha.officialDescription': 'Descripción Oficial del Atractivo',
    'ficha.minceturInventory': 'Inventario MINCETUR',
    'ficha.techSpecs': 'Ficha Técnica Oficial',
    'ficha.category': 'Categoría:',
    'ficha.type': 'Tipo:',
    'ficha.subtype': 'Subtipo:',
    'ficha.altitude': 'Altitud:',
    'ficha.notSpecified': 'No especificada',
    'ficha.notSpecifiedMale': 'No especificado',
    'ficha.viewOnMap': 'Ver Ubicación en Mapa',
    'ficha.seasonAndHours': 'Época Propicia y Horarios',
    'ficha.visit': 'Visita',
    'ficha.recommendedSeason': 'Temporada Recomendada',
    'ficha.visitingHours': 'Horario de Visita',
    'ficha.recommendations': 'Recomendaciones',
    'ficha.activitiesInResource': 'Actividades en el Recurso',
    'ficha.howToGet': 'Ruta de Acceso al Recurso (Cómo Llegar)',
    'ficha.howToGetDesc': 'Itinerario oficial registrado tramo por tramo con medios de transporte, tipo de vía y tiempos estimados.',
    'ficha.registeredSections': 'Tramos Registrados',
    'ficha.liveVideo': 'Material Audiovisual Oficial (Video en Vivo)',
    'ficha.additionalInfo': 'Información Adicional del Inventario Oficial',
    'ficha.section': 'Tramo',
  },
  EN: {
    // Navbar
    'nav.inicio': 'Home',
    'nav.turismo': 'Tourism',
    'nav.busquedaAvanzada': 'Advanced Search',
    'nav.buscar': 'Search',
    'nav.portalNacional': 'National Tourism Open Data Portal',
    'nav.selectLang': 'Language / Idioma',

    // Search Modal
    'search.modalTitle': 'Search Tourist Destinations',
    'search.placeholder': 'Type destination name, region, province...',
    'search.popular': 'Popular searches:',
    'search.popular1': 'Machu Picchu',
    'search.popular2': 'Lake Titicaca',
    'search.popular3': 'Colca Canyon',
    'search.popular4': 'Kuelap',
    'search.popular5': 'Huacachina',
    'search.pressEnter': 'Press Enter to search the national inventory',
    'search.close': 'Close',
    'search.exploreAll': 'View all results',

    // Home Page - Hero
    'hero.title1': 'Discover the Tourist Destinations of',
    'hero.titlePeru': 'Peru',
    'hero.subtitle': 'Explore archaeological wonders, natural sites, official routes and heritage across 25 regions with real-time verified open data.',
    'hero.btnExplore': 'Explore Resources',

    // Home Page - Advantages
    'home.advantagesBadge': 'Platform Advantages',
    'home.whyChoose': 'Why Choose',
    'home.whyChooseDesc': 'We are the most intuitive open data and tourism georeferencing viewer in the country. We connect citizens, travelers, students, researchers and tour operators with 100% official data quickly, cleanly and seamlessly.',
    'home.feat1Title': '100% Official Data',
    'home.feat1Desc': 'Technical and photographic information synchronized directly with the MINCETUR national inventory.',
    'home.feat2Title': 'Free & Secure Access',
    'home.feat2Desc': 'Unlimited exploration with no required signup, no personal data collection, and no ad tracking.',
    'home.feat3Title': 'Routes & Itineraries',
    'home.feat3Desc': 'Step-by-step guidance to reach every destination with transport methods, road types and travel times.',
    'home.feat4Title': 'Smart Search',
    'home.feat4Desc': 'Dynamic filters by region, category, activity or unique technical code to find your destination instantly.',

    // Home Page - Metrics
    'home.metricAttractions': 'Destinations',
    'home.metricRegions': 'Regions',
    'home.metricOpen': 'Open Data',

    // Home Page - CTA
    'home.ctaTitle': 'Ready to Explore Peru?',
    'home.ctaDesc': 'Access the complete OpenData catalog with over 5,000 georeferenced tourist attractions, official photos, and live video.',
    'home.ctaBtn': 'Explore the Catalog Now',

    // Turismo Page
    'turismo.badge': 'Tourism Exploration & Discovery Module',
    'turismo.title': 'Catalog of',
    'turismo.titleHighlight': 'Tourist Resources',
    'turismo.subtitle': 'Query, filter, and discover more than 5,000 georeferenced attractions throughout Peruvian territory.',
    'turismo.searchPlaceholder': 'Search by name or keyword (e.g., Machu Picchu, Colca, Lake Titicaca...)',
    'turismo.btnAdvanced': 'Advanced (Code)',
    'turismo.btnSearch': 'Search',
    'turismo.filterRegion': 'Region / Department',
    'turismo.allRegions': 'All regions (25)',
    'turismo.filterCategory': 'Category',
    'turismo.allCategories': 'All categories',
    'turismo.filterActivity': 'Activity',
    'turismo.allActivities': 'All activities',
    'turismo.advancedTitle': 'Advanced Search by Official Record Code',
    'turismo.advancedPlaceholder': 'Enter record number (e.g., 62, 154, 820, 7482...)',
    'turismo.advancedDesc': 'Direct search using the unique numeric identifier registered in the inventory.',
    'turismo.removeCode': 'Remove code',
    'turismo.filtersApplied': 'Filters applied to current search',
    'turismo.filtersReady': 'Selected filters ready to search',
    'turismo.clearFilters': 'Clear all filters',
    'turismo.sectionBadge': 'Open Exploration',
    'turismo.allResources': 'All Registered Tourist Resources',
    'turismo.resourcesIn': 'Resources in',
    'turismo.codeSearch': 'Record Code #',
    'turismo.resultsFor': 'Results for',
    'turismo.foundCount': 'attractions found',
    'turismo.reset': 'Reset',
    'turismo.loading': 'Querying open database...',
    'turismo.noResults': 'No tourist attractions found',
    'turismo.noResultsDesc': 'Try adjusting your search criteria, switching region or clearing the applied filters.',
    'turismo.viewSheet': 'View Details',
    'turismo.inventory': 'Inventory',

    // Footer
    'footer.desc': 'National open data platform for interactive query, georeferencing, and exploration of Peru’s tourist resources and attractions.',
    'footer.connect': 'Connect with Us',
    'footer.nav': 'Navigation',
    'footer.navHome': 'Home (Main Portal)',
    'footer.navTurismo': 'Tourism & Explorer',
    'footer.navMap': 'Regions Map',
    'footer.navCatalog': 'Georeferenced Catalog',
    'footer.dataApi': 'Open Data & API',
    'footer.transparency': 'Transparency',
    'footer.terms': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.license': 'Open Data License',
    'footer.claims': 'Complaints Book',
    'footer.faq': 'Frequently Asked Questions (FAQ)',
    'footer.rights': 'National Tourism Open Data Repository of Peru',

    // Card
    'card.loadingPhoto': 'Loading official photograph...',
    'card.noPhoto': 'No digitized photo in official record',
    'card.recordNum': 'Record',
    'card.inventoryTitle': 'National Tourism Inventory',
    'card.touristResource': 'Tourist Resource',
    'card.themeMuseum': 'Museum & Exhibition',
    'card.themeCultural': 'Cultural Heritage',
    'card.themeWater': 'Water Body / Coast',
    'card.themeNature': 'Natural Formation',
    'card.themeGeneral': 'Tourist Resource',

    // Ficha Detail Page
    'ficha.breadcrumbHome': 'Home',
    'ficha.breadcrumbTurismo': 'Tourism',
    'ficha.backToCatalog': 'Back to Catalog',
    'ficha.sourceFile': 'Source Record',
    'ficha.loading': 'Loading official resource data...',
    'ficha.notFound': 'This record does not exist or has been retired from the official inventory.',
    'ficha.notFoundDesc': 'The requested resource is not published or registered in the official inventory.',
    'ficha.exploreOther': 'Explore other official destinations',
    'ficha.officialPhoto': 'Official Resource Photograph',
    'ficha.officialGallery': 'Official Gallery',
    'ficha.photos': 'photos',
    'ficha.officialDescription': 'Official Resource Description',
    'ficha.minceturInventory': 'MINCETUR Inventory',
    'ficha.techSpecs': 'Official Technical Sheet',
    'ficha.category': 'Category:',
    'ficha.type': 'Type:',
    'ficha.subtype': 'Subtype:',
    'ficha.altitude': 'Altitude:',
    'ficha.notSpecified': 'Not specified',
    'ficha.notSpecifiedMale': 'Not specified',
    'ficha.viewOnMap': 'View Location on Map',
    'ficha.seasonAndHours': 'Best Season & Visiting Hours',
    'ficha.visit': 'Visit',
    'ficha.recommendedSeason': 'Recommended Season',
    'ficha.visitingHours': 'Visiting Hours',
    'ficha.recommendations': 'Recommendations',
    'ficha.activitiesInResource': 'Activities in Destination',
    'ficha.howToGet': 'Access Route & How to Get There',
    'ficha.howToGetDesc': 'Official itinerary recorded section by section with transportation modes, road types and estimated travel times.',
    'ficha.registeredSections': 'Registered Sections',
    'ficha.liveVideo': 'Official Audiovisual Material (Live Video)',
    'ficha.additionalInfo': 'Additional Information from Official Inventory',
    'ficha.section': 'Section',
  },
  QU: {
    // Navbar
    'nav.inicio': 'Qallariy',
    'nav.turismo': 'Puriy / Turismo',
    'nav.busquedaAvanzada': 'Tarpuy Maskay',
    'nav.buscar': 'Maskay',
    'nav.portalNacional': 'Piruw Suyupa Kichasqa Willakuy Llikan',
    'nav.selectLang': 'Simi / Idioma',

    // Search Modal
    'search.modalTitle': 'Piruwpa sumaq kayninkunata maskay',
    'search.placeholder': 'Llaqtapa sutinta, suyuta, kitiyta qillqay...',
    'search.popular': 'Aswan maskasqakuna:',
    'search.popular1': 'Machu Pikchu',
    'search.popular2': 'Titiqaqa Qucha',
    'search.popular3': 'Qullqa Wayq\'u',
    'search.popular4': 'Kuelap',
    'search.popular5': 'Wakachina',
    'search.pressEnter': 'Enter ñit\'iy llapa suyukunapi maskanapaq',
    'search.close': 'Wichqay',
    'search.exploreAll': 'Llapan tariykunata qhaway',

    // Home Page - Hero
    'hero.title1': 'Piruw Suyupa Sumaq',
    'hero.titlePeru': 'Kawsayninta Riqsiy',
    'hero.subtitle': 'Kawsay pacha, ñawpa llaqtakuna, ñankuna riqsiy chaninchasqa willakuykunawan.',
    'hero.btnExplore': 'Sumaq Kitiykunata Qhaway',

    // Home Page - Advantages
    'home.advantagesBadge': 'Llikapa Allin Kayninkuna',
    'home.whyChoose': 'Imaraykutaq',
    'home.whyChooseDesc': 'Piruw suyupi astawan allin, sumaq kichasqa willakuy qhawachiq kanchik. Riqsiqkunata, yachakuqkunata, puriqkunata MINCETUR willakuykunawan tinkuchinchik.',
    'home.feat1Title': '100% Kamachisqa Willakuy',
    'home.feat1Desc': 'MINCETUR inventariomanta chiqap willakuykuna, fotokuna mana chinkaspa.',
    'home.feat2Title': 'Kichasqa & Waqaychasqa',
    'home.feat2Desc': 'Mana sutiykita churaspalla, mana qullqillapaq llapanta qhaway.',
    'home.feat3Title': 'Ñankuna & Purinakuna',
    'home.feat3Desc': 'Imaynata chayanaykipaq ñankuna, awtukuna, pachankunata willasunki.',
    'home.feat4Title': 'Yachaysapa Maskay',
    'home.feat4Desc': 'Suyukuna, kayninkuna, ruraykunakama utqaylla maskay.',

    // Home Page - Metrics
    'home.metricAttractions': 'Sumaq Kitiykuna',
    'home.metricRegions': 'Suyukuna',
    'home.metricOpen': 'Kichasqa',

    // Home Page - CTA
    'home.ctaTitle': '¿Piruwta Riqsiyta Munankichu?',
    'home.ctaDesc': 'OpenData llikapi 5,000 masnin sumaq kitiykunata, chiqap fotokunata, videokunata qhaway.',
    'home.ctaBtn': 'Kunan Qhaway',

    // Turismo Page
    'turismo.badge': 'Piruw Suyupi Sumaq Kitiykuna Maskana',
    'turismo.title': 'Llapanchikpaq',
    'turismo.titleHighlight': 'Sumaq Kitiykuna',
    'turismo.subtitle': '5,000 masnin chaninchasqa kitiykunata llapa Piruw suyupi maskay.',
    'turismo.searchPlaceholder': 'Sutinta qillqay (kayhina: Machu Pikchu, Qullqa, Titiqaqa...)',
    'turismo.btnAdvanced': 'Yupikama (Código)',
    'turismo.btnSearch': 'Maskay',
    'turismo.filterRegion': 'Suyu / Departamento',
    'turismo.allRegions': 'Llapan suyukuna (25)',
    'turismo.filterCategory': 'Kaynin / Categoría',
    'turismo.allCategories': 'Llapan kayninkuna',
    'turismo.filterActivity': 'Ruray / Actividad',
    'turismo.allActivities': 'Llapan ruraykuna',
    'turismo.advancedTitle': 'Ficha Yupawan Maskay',
    'turismo.advancedPlaceholder': 'Ficha yupayta qillqay (kayhina: 62, 154, 820...)',
    'turismo.advancedDesc': 'Sapaq yupinwan chiqap kitiyta maskay.',
    'turismo.removeCode': 'Yupita pichay',
    'turismo.filtersApplied': 'Maskasqapi akllasqakuna',
    'turismo.filtersReady': 'Maskanapaq akllasqakuna',
    'turismo.clearFilters': 'Llapanta pichay',
    'turismo.sectionBadge': 'Kichasqa Puriy',
    'turismo.allResources': 'Llapan Qillqasqa Sumaq Kitiykuna',
    'turismo.resourcesIn': 'Kitiykuna kay suyupi:',
    'turismo.codeSearch': 'Ficha Yupiy N°',
    'turismo.resultsFor': 'Tariy kaypaq:',
    'turismo.foundCount': 'sumaq kitiykuna tarisqa',
    'turismo.reset': 'Kutichiy',
    'turismo.loading': 'Willakuykunata maskachkan...',
    'turismo.noResults': 'Manam kitiykuna tarisqachu',
    'turismo.noResultsDesc': 'Huk suyuta akllay utaq maskasqaykita allichay.',
    'turismo.viewSheet': 'Fichata Qhaway',
    'turismo.inventory': 'Inventario',

    // Footer
    'footer.desc': 'Piruw suyupa sumaq kitiyninkuna qhawanapaq, kawsayninta riqsinapaq kichasqa willakuy llika.',
    'footer.connect': 'Ñuqaykuwan Tinkiy',
    'footer.nav': 'Navegación',
    'footer.navHome': 'Qallariy',
    'footer.navTurismo': 'Puriy / Turismo',
    'footer.navMap': 'Suyukunapa Mapan',
    'footer.navCatalog': 'Llapan Kitiykuna',
    'footer.dataApi': 'Kichasqa Willakuy & API',
    'footer.transparency': 'Sut\'i Kawsay',
    'footer.terms': 'Kamachikuykuna',
    'footer.privacy': 'Waqaychay Políticas',
    'footer.license': 'Kichasqa Licencia',
    'footer.claims': 'Reclamaciones Qillqa',
    'footer.faq': 'Tapukuykuna (FAQ)',
    'footer.rights': 'Piruw Suyupa Kichasqa Turismo Willakuynin',

    // Card
    'card.loadingPhoto': 'Chiqap fotota apamuspa...',
    'card.noPhoto': 'Mana fotoyuq chiqap fichapi',
    'card.recordNum': 'Ficha',
    'card.inventoryTitle': 'Mama Llaqtapa Turismo Inventario',
    'card.touristResource': 'Sumaq Kiti',
    'card.themeMuseum': 'Museum Wasikuna',
    'card.themeCultural': 'Kultura Kawsay',
    'card.themeWater': 'Qucha / Mayu Kawsay',
    'card.themeNature': 'Sallqa Pacha',
    'card.themeGeneral': 'Sumaq Kiti',

    // Ficha Detail Page
    'ficha.breadcrumbHome': 'Qallariy',
    'ficha.breadcrumbTurismo': 'Turismo',
    'ficha.backToCatalog': 'Kutiy Catálogoman',
    'ficha.sourceFile': 'Qallariy Ficha',
    'ficha.loading': 'Chiqap willakuykunata apamuspa...',
    'ficha.notFound': 'Kay fichaqa manam kanchu utaq inventariomanta pichasqam.',
    'ficha.notFoundDesc': 'Maskasqayki kitiqa manam inventariopi kanchu.',
    'ficha.exploreOther': 'Huk kitiykunata qhaway',
    'ficha.officialPhoto': 'Chiqap Foto',
    'ficha.officialGallery': 'Fotokuna Galeriyan',
    'ficha.photos': 'fotokuna',
    'ficha.officialDescription': 'Chiqap Sut\'inchay',
    'ficha.minceturInventory': 'MINCETUR Inventario',
    'ficha.techSpecs': 'Ficha Técnica Oficial',
    'ficha.category': 'Kaynin:',
    'ficha.type': 'Niraq:',
    'ficha.subtype': 'Huch\'uy Niraq:',
    'ficha.altitude': 'Sayaynin:',
    'ficha.notSpecified': 'Mana willasqachu',
    'ficha.notSpecifiedMale': 'Mana willasqachu',
    'ficha.viewOnMap': 'Mapapi Qhaway',
    'ficha.seasonAndHours': 'Allin Pacha & Horariokuna',
    'ficha.visit': 'Watukuy',
    'ficha.recommendedSeason': 'Allin Pacha Watukunapaq',
    'ficha.visitingHours': 'Watukuna Horario',
    'ficha.recommendations': 'Kunaykuna',
    'ficha.activitiesInResource': 'Ruraykuna Kay Kitipi',
    'ficha.howToGet': 'Imaynata Chayana Ñan',
    'ficha.howToGetDesc': 'Chiqap ñankuna, awtukuna, tiempokunata willaspa.',
    'ficha.registeredSections': 'Tramos',
    'ficha.liveVideo': 'Chiqap Video',
    'ficha.additionalInfo': 'Inventariomanta Huk Willakuykuna',
    'ficha.section': 'Tramo',
  },
};

type TranslationKey = keyof typeof translations['ES'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ES',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('opendata_lang') as Language;
        if (saved && ['ES', 'EN', 'QU'].includes(saved)) {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'ES';
  });

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('opendata_lang') as Language;
      if (savedLang && ['ES', 'EN', 'QU'].includes(savedLang)) {
        setLanguageState(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('opendata_lang', lang);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey | string): string => {
    const langDict = translations[language] as Record<string, string>;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const defaultDict = translations.ES as Record<string, string>;
    return defaultDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
