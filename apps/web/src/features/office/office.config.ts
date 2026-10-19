// Public demo coordinates, not the company's actual office address.
export const officeLocation = {
  coordinates: [50.4387, 30.5232] as [number, number],
  zoom: 16,
  address: {
    ru: "БЦ Gulliver, Спортивная площадь, 1-А, Киев, Украина",
    uk: "БЦ Gulliver, Спортивна площа, 1-А, Київ, Україна",
  },
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
};

const [latitude, longitude] = officeLocation.coordinates;
export const officeMapUrl =
  `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}` +
  `#map=${officeLocation.zoom}/${latitude}/${longitude}`;
