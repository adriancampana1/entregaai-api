export interface Order {
  _id: string;
  check: number;
  from: string;
  salesChannel: string;
  updatedAt: string;
}

export interface ListOrdersResponse {
  success: boolean;
  info: {
    docs: Order[];
    count: number;
    limit: number;
    currentPage: number;
  };
}

export interface OrderDetails {
  _id: string;
  additionalFees: [
    {
      type: string;
      description: string;
      value: number;
    },
  ];
  check: number;
  createdAt: string;
  customer: {
    id: string | null;
    name: string;
    phone: string;
    taxPayerIdentificationNumber: string;
    localizer: string;
  };
  deliveryAddress: {
    formattedAddress: string;
    country: string;
    state: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    neighborhood: string;
    streetName: string;
    streetNumber: string;
    postalCode: string;
    reference: string | null;
    complement: string;
    ifood_pickup_code: string;
  };
  deliveryFee: number;
  discounts: {
    amount: number;
    tag: string;
    target: string;
  }[];
  from: string;
  id: string;
  ifood_id: string;
  items: {
    _id: string;
    id: number;
    name: string;
    quantity: number;
    observation: string;
    externalId: string;
    backoffice_id: string;
    internalId: string;
    price: number;
    total: number;
    subItems: {
      _id: string;
      name: string;
      quantity: number;
      externalId: string;
      internalId: string;
      backoffice_id: string;
      price: number;
      total: number;
      externalCode: string;
      id: number;
      id_parent: number;
      quantityFraction: number;
      valueFraction: number;
    }[];
  }[];
  menu_version: number;
  merchant: {
    name: string;
    id: string;
    unit: string;
  };
  observation: string;
  order_automatic_accept: boolean;
  payments: {
    name: string;
    code: string;
    value: string;
    cardSelected: string;
    externalId: string;
    changeFor: null;
    prepaid: boolean;
  }[];
  pdv: {
    status: boolean;
  };
  preparationStartDateTime: string;
  salesChannel: string;
  shortReference: number;
  time_max: string;
  total: number;
  type: string;
  updatedAt: string;
}

export interface OrderDetailsResponse {
  success: boolean;
  info: OrderDetails;
}
