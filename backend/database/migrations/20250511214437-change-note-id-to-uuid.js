"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await queryInterface.removeConstraint("Note", "Note_pkey");
    await queryInterface.removeColumn("Note", "id");
    await queryInterface.addColumn("Note", "id", {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.literal("uuid_generate_v4()"),
    });
    await queryInterface.addConstraint("Note", {
      type: "primary key",
      fields: ["id"],
      name: "Note_pkey",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("Note", "Note_pkey");

    await queryInterface.removeColumn("Note", "id");

    await queryInterface.addColumn("Note", "id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
    });

    await queryInterface.addConstraint("Note", {
      type: "primary key",
      fields: ["id"],
      name: "Note_pkey",
    });

    await queryInterface.sequelize.query(`
      DROP EXTENSION IF EXISTS "uuid-ossp";
    `);
  },
};
