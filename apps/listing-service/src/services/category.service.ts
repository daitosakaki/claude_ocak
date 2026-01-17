import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListingCategory, ListingCategoryDocument } from '../schemas/listing-category.schema';

/**
 * Kategori yönetim servisi
 */
@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(ListingCategory.name)
    private readonly categoryModel: Model<ListingCategoryDocument>,
  ) {}

  /**
   * Tüm kategorileri getir (ağaç yapısında)
   */
  async findAll(): Promise<CategoryTree[]> {
    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1 })
      .exec();

    // Ağaç yapısına dönüştür
    return this.buildTree(categories);
  }

  /**
   * Slug ile kategori bul
   */
  async findBySlug(slug: string): Promise<CategoryWithAttributes> {
    const category = await this.categoryModel.findOne({ slug, isActive: true }).exec();

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // Üst kategorileri de getir (breadcrumb için)
    const breadcrumbs = await this.getBreadcrumbs(category);

    // Alt kategorileri getir
    const children = await this.categoryModel
      .find({ parentId: category._id, isActive: true })
      .sort({ order: 1 })
      .exec();

    return {
      id: category._id.toString(),
      slug: category.slug,
      name: category.name,
      level: category.level,
      icon: category.icon,
      attributes: category.attributes,
      listingsCount: category.listingsCount,
      breadcrumbs,
      children: children.map((c) => ({
        id: c._id.toString(),
        slug: c.slug,
        name: c.name,
        listingsCount: c.listingsCount,
      })),
    };
  }

  /**
   * Path ile kategori bul
   */
  async findByPath(path: string): Promise<ListingCategoryDocument | null> {
    return this.categoryModel.findOne({ path, isActive: true }).exec();
  }

  /**
   * Kategori ilan sayısını güncelle
   */
  async updateListingsCount(categoryPath: string, increment: number): Promise<void> {
    // Path'teki tüm kategorilerin sayısını güncelle
    const pathParts = categoryPath.split('/');
    const paths: string[] = [];

    for (let i = 1; i <= pathParts.length; i++) {
      paths.push(pathParts.slice(0, i).join('/'));
    }

    await this.categoryModel.updateMany(
      { path: { $in: paths } },
      { $inc: { listingsCount: increment } },
    );
  }

  /**
   * Breadcrumb listesi oluştur
   */
  private async getBreadcrumbs(
    category: ListingCategoryDocument,
  ): Promise<{ slug: string; name: { tr: string; en: string } }[]> {
    const breadcrumbs: { slug: string; name: { tr: string; en: string } }[] = [];
    let current: ListingCategoryDocument | null = category;

    while (current) {
      breadcrumbs.unshift({
        slug: current.slug,
        name: current.name,
      });

      if (current.parentId) {
        current = await this.categoryModel.findById(current.parentId).exec();
      } else {
        current = null;
      }
    }

    return breadcrumbs;
  }

  /**
   * Kategori listesini ağaç yapısına dönüştür
   */
  private buildTree(categories: ListingCategoryDocument[]): CategoryTree[] {
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // Önce tüm kategorileri map'e ekle
    categories.forEach((cat) => {
      map.set(cat._id.toString(), {
        id: cat._id.toString(),
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        listingsCount: cat.listingsCount,
        children: [],
      });
    });

    // Sonra parent-child ilişkilerini kur
    categories.forEach((cat) => {
      const node = map.get(cat._id.toString())!;

      if (cat.parentId) {
        const parent = map.get(cat.parentId.toString());
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}

// ==================== Tipler ====================

interface CategoryTree {
  id: string;
  slug: string;
  name: { tr: string; en: string };
  icon?: string;
  listingsCount: number;
  children: CategoryTree[];
}

interface CategoryWithAttributes {
  id: string;
  slug: string;
  name: { tr: string; en: string };
  level: number;
  icon?: string;
  attributes: Array<{
    key: string;
    label: { tr: string; en: string };
    type: string;
    options?: string[];
    required: boolean;
    filterable: boolean;
  }>;
  listingsCount: number;
  breadcrumbs: { slug: string; name: { tr: string; en: string } }[];
  children: { id: string; slug: string; name: { tr: string; en: string }; listingsCount: number }[];
}
