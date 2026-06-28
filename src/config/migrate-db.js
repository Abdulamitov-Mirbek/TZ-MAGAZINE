const { DataTypes, QueryTypes } = require("sequelize");
const { sequelize } = require("./db");

const slugify = (value) => {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "category";
};

const getTable = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch (error) {
    if (error.message.includes("No description found")) {
      return null;
    }

    throw error;
  }
};

const ensureColumn = async (queryInterface, tableName, columnName, definition) => {
  const table = await getTable(queryInterface, tableName);

  if (!table) {
    return;
  }

  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

const ensureIndex = async (queryInterface, tableName, indexName, fields) => {
  const indexes = await queryInterface.showIndex(tableName);
  const exists = indexes.some((index) => index.name === indexName);

  if (!exists) {
    await queryInterface.addIndex(tableName, fields, {
      name: indexName,
      unique: true,
    });
  }
};

const backfillCategorySlugs = async () => {
  const categories = await sequelize.query(
    'SELECT id, name, slug FROM "Categories" ORDER BY "createdAt" ASC',
    { type: QueryTypes.SELECT },
  );
  const usedSlugs = new Set(
    categories
      .map((category) => category.slug)
      .filter(Boolean)
      .map((slug) => slug.toLowerCase()),
  );

  for (const category of categories) {
    if (category.slug) {
      continue;
    }

    const baseSlug = slugify(category.name);
    let nextSlug = baseSlug;
    let counter = 2;

    while (usedSlugs.has(nextSlug.toLowerCase())) {
      nextSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    usedSlugs.add(nextSlug.toLowerCase());

    await sequelize.query(
      'UPDATE "Categories" SET slug = :slug WHERE id = :id',
      {
        replacements: {
          id: category.id,
          slug: nextSlug,
        },
      },
    );
  }
};

const runSchemaMigrations = async () => {
  const queryInterface = sequelize.getQueryInterface();

  await ensureColumn(queryInterface, "Categories", "slug", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await backfillCategorySlugs();
  await queryInterface.changeColumn("Categories", "slug", {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await ensureIndex(queryInterface, "Categories", "categories_slug_unique", [
    "slug",
  ]);

  await ensureColumn(queryInterface, "Products", "imageUrl", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await ensureColumn(queryInterface, "Products", "categoryId", {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Categories",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
};

module.exports = { runSchemaMigrations };
