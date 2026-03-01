import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../database";

interface ContactAttributes {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: "primary" | "secondary";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ContactCreationAttributes
  extends Optional<ContactAttributes, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

class Contact
  extends Model<ContactAttributes, ContactCreationAttributes>
  implements ContactAttributes
{
  public id!: number;
  public phoneNumber!: string | null;
  public email!: string | null;
  public linkedId!: number | null;
  public linkPrecedence!: "primary" | "secondary";
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    linkPrecedence: {
      type: DataTypes.ENUM("primary", "secondary"),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Contact",
    timestamps: true,
    paranoid: false,
  }
);

export default Contact;
