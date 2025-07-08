import { Page, PageStatus, PageType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreatePageData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  type?: PageType;
  status?: PageStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  category?: string;
  tags?: string;
  sortOrder?: number;
  isPublic?: boolean;
  requireAuth?: boolean;
  publishedAt?: Date;
}

export interface UpdatePageData extends Partial<CreatePageData> {}

export interface PageFilters {
  search?: string;
  status?: PageStatus;
  type?: PageType;
  category?: string;
  isPublic?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface PageListResult {
  pages: Page[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PageService {
  // GET /admin/pages - Liste paginée avec filtres
  static async getPages(
    filters: PageFilters = {},
    pagination: PaginationOptions
  ): Promise<PageListResult> {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = pagination;
    const offset = (page - 1) * limit;

    // Construction de la clause WHERE
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
        { content: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    // Validation du tri
    const validSortFields = [
      "title",
      "slug",
      "status",
      "type",
      "category",
      "sortOrder",
      "createdAt",
      "updatedAt",
      "publishedAt",
    ];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const finalSortDirection = sortDirection === "asc" ? "asc" : "desc";

    // Récupération des pages
    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: { [finalSortBy]: finalSortDirection },
        skip: offset,
        take: limit,
      }),
      prisma.page.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // GET /admin/pages/:id - Récupération d'une page par ID
  static async getPageById(id: string): Promise<Page> {
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new Error("Page non trouvée");
    }

    return page;
  }

  // GET /admin/pages/slug/:slug - Récupération d'une page par slug
  static async getPageBySlug(slug: string): Promise<Page> {
    const page = await prisma.page.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new Error("Page non trouvée");
    }

    return page;
  }

  // POST /admin/pages - Création d'une nouvelle page
  static async createPage(data: CreatePageData): Promise<Page> {
    // Vérification de l'unicité du slug
    const existingPage = await prisma.page.findUnique({
      where: { slug: data.slug },
    });

    if (existingPage) {
      throw new Error("Une page avec ce slug existe déjà");
    }

    // Préparation des données
    const pageData = {
      ...data,
      publishedAt: data.status === "PUBLISHED" ? new Date() : data.publishedAt,
    };

    const page = await prisma.page.create({
      data: pageData,
    });

    console.log(`📄 [PAGE_SERVICE] Page créée: ${page.title} (${page.id})`);
    return page;
  }

  // PUT /admin/pages/:id - Mise à jour complète d'une page
  static async updatePage(id: string, data: UpdatePageData): Promise<Page> {
    // Vérification de l'existence de la page
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      throw new Error("Page non trouvée");
    }

    // Vérification de l'unicité du slug si modifié
    if (data.slug && data.slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        throw new Error("Une page avec ce slug existe déjà");
      }
    }

    // Gestion de la date de publication
    let publishedAt = data.publishedAt;
    if (data.status === "PUBLISHED" && existingPage.status !== "PUBLISHED") {
      publishedAt = new Date();
    } else if (data.status !== "PUBLISHED") {
      publishedAt = undefined;
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        ...data,
        publishedAt,
      },
    });

    console.log(
      `📄 [PAGE_SERVICE] Page mise à jour: ${updatedPage.title} (${id})`
    );
    return updatedPage;
  }

  // PATCH /admin/pages/:id - Mise à jour partielle d'une page
  static async patchPage(id: string, data: UpdatePageData): Promise<Page> {
    return this.updatePage(id, data);
  }

  // DELETE /admin/pages/:id - Suppression d'une page
  static async deletePage(id: string): Promise<void> {
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      throw new Error("Page non trouvée");
    }

    await prisma.page.delete({
      where: { id },
    });

    console.log(
      `📄 [PAGE_SERVICE] Page supprimée: ${existingPage.title} (${id})`
    );
  }

  // PATCH /admin/pages/:id/publish - Publication d'une page
  static async publishPage(id: string): Promise<Page> {
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new Error("Page non trouvée");
    }

    if (page.status === "PUBLISHED") {
      throw new Error("La page est déjà publiée");
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    console.log(`📄 [PAGE_SERVICE] Page publiée: ${updatedPage.title} (${id})`);
    return updatedPage;
  }

  // PATCH /admin/pages/:id/unpublish - Dépublier une page
  static async unpublishPage(id: string): Promise<Page> {
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new Error("Page non trouvée");
    }

    if (page.status !== "PUBLISHED") {
      throw new Error("La page n'est pas publiée");
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        status: "DRAFT",
        publishedAt: null,
      },
    });

    console.log(
      `📄 [PAGE_SERVICE] Page dépubliée: ${updatedPage.title} (${id})`
    );
    return updatedPage;
  }

  // GET /admin/pages/stats - Statistiques des pages
  static async getPageStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    scheduled: number;
  }> {
    const [total, published, draft, archived, scheduled] = await Promise.all([
      prisma.page.count(),
      prisma.page.count({ where: { status: "PUBLISHED" } }),
      prisma.page.count({ where: { status: "DRAFT" } }),
      prisma.page.count({ where: { status: "ARCHIVED" } }),
      prisma.page.count({ where: { status: "SCHEDULED" } }),
    ]);

    return {
      total,
      published,
      draft,
      archived,
      scheduled,
    };
  }

  // Validation des données de page
  static validatePageData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (
      !data.title ||
      typeof data.title !== "string" ||
      data.title.trim().length < 1
    ) {
      errors.push("Le titre est requis et doit faire au moins 1 caractère");
    }

    if (
      !data.slug ||
      typeof data.slug !== "string" ||
      data.slug.trim().length < 1
    ) {
      errors.push("Le slug est requis et doit faire au moins 1 caractère");
    }

    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push(
        "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"
      );
    }

    if (
      !data.content ||
      typeof data.content !== "string" ||
      data.content.trim().length < 1
    ) {
      errors.push("Le contenu est requis et doit faire au moins 1 caractère");
    }

    if (data.title && data.title.length > 255) {
      errors.push("Le titre ne peut pas dépasser 255 caractères");
    }

    if (data.slug && data.slug.length > 255) {
      errors.push("Le slug ne peut pas dépasser 255 caractères");
    }

    if (data.metaTitle && data.metaTitle.length > 255) {
      errors.push("Le meta title ne peut pas dépasser 255 caractères");
    }

    if (data.category && data.category.length > 100) {
      errors.push("La catégorie ne peut pas dépasser 100 caractères");
    }

    if (
      data.sortOrder !== undefined &&
      (typeof data.sortOrder !== "number" || data.sortOrder < 0)
    ) {
      errors.push("L'ordre de tri doit être un nombre positif");
    }

    return { isValid: errors.length === 0, errors };
  }
}
