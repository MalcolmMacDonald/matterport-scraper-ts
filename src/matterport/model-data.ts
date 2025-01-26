export interface ModelData {
    id: string;
    name: string;
    visibility: string;
    discoverable: boolean;
    state: string;
    image: Image;
    publication: Publication;
    options: ModelDataOptions;
    assets: Assets;
    lod: Lod;
    overlayLayers: any[];
    defurnishViews: any[];
    legacyBaseView: LegacyBaseView;
    locations: Location[];
    floors: FloorElement[];
    rooms: Room[];
    views: View[];
    policies: Policy[];
}

export interface Assets {
    meshes: Mesh[];
    textures: Texture[];
    tilesets: any[];
}

export interface Mesh {
    id: string;
    status: "available";
    filename: string;
    format: string;
    resolution: MeshResolution;
    url: string;
    validUntil: Date;
}

export type MeshResolution = "50k" | "500k";

export interface Texture {
    id: string;
    status: "available";
    format: string;
    resolution: MeshResolution;
    quality: TextureQuality;
    urlTemplate: string;
    validUntil: Date;
}

export type TextureQuality = "2k" | "4k" | "high" | "low";

export interface FloorElement {
    id: string;
    meshId: number;
    classification?: string;
    label: string;
    sequence: number;
    dimensions: FloorDimensions;
}

export interface FloorDimensions {
    areaFloor: number;
    units: string;
}

export interface Image {
    id: string;
    label: string;
    category: string;
    height: number;
    width: number;
    created: Date;
    modified: Date;
    status: "available";
    filename: string;
    format: string;
    url: string;
    resolutions: string[];
    type: string;
    origin: string;
    validUntil: Date;
    thumbnailUrl: string;
    presentationUrl: string;
    snapshotLocation: SnapshotLocation;
}

export interface SnapshotLocation {
    viewMode: string;
    position: Tion;
    rotation: Tion;
    zoom: number;
    floorVisibility: any[];
    anchor: Anchor;
}

export interface Anchor {
    id: string;
    pano: AnchorPano;
}

export interface AnchorPano {
    id: string;
    placement: "auto";
}

export interface Tion {
    x: number;
    y: number;
    z: number;
    w?: number;
}

export interface LegacyBaseView {
    model: Model;
}

export interface Model {
    id: string;
}

export interface Location {
    id: string;
    index: number;
    floor: RoomClass;
    room: RoomClass;
    neighbors: string[];
    tags: Tag[];
    position: Tion;
    pano: LocationPano;
}

export interface RoomClass {
    id: string;
    meshId: number;
}

export interface LocationPano {
    id: string;
    sweepUuid: string;
    label: string;
    placement: "auto";
    source: "vision";
    position: Tion;
    rotation: Tion;
    resolutions: TextureQuality[];
    skyboxes: Skybox[];
}

export interface Skybox {
    resolution: TextureQuality;
    status: "available";
    urlTemplate: string;
    tileResolution: string;
    tileCount: number;
    tileUrlTemplate: string;
    validUntil: Date;
}

export type Tag = "vr" | "showcase";

export interface Lod {
    options: string[];
}

export interface ModelDataOptions {
    urlBrandingEnabled: boolean;
    socialSharingEnabled: boolean;
    vrEnabled: boolean;
    backgroundColor: string;
    defurnishViewEnabled: boolean;
    dollhouseEnabled: boolean;
    dollhouseLabelsEnabled: boolean;
    floorSelectEnabled: boolean;
    floorplanEnabled: boolean;
    highlightReelEnabled: boolean;
    labelsEnabled: boolean;
    measurements: string;
    roomBoundsEnabled: boolean;
    spaceSearchEnabled: boolean;
    tourButtonsEnabled: boolean;
    tourDollhousePanSpeed: number;
    tourFastTransitionsEnabled: boolean;
    tourPanAngle: number;
    tourPanDirection: "auto";
    tourPanSpeed: number;
    tourTransitionSpeed: number;
    tourTransitionTime: number;
    tourZoomDuration: number;
    unitType: string;
}

export interface Policy {
    name: string;
    type: string;
    enabled?: boolean;
    options?: string[];
    availability?: string;
    value?: string;
}

export interface Publication {
    address: string;
    published: boolean;
    presentedBy: string;
    summary: string;
    description: string;
    externalUrl: string;
    contact: Contact;
    options: PublicationOptions;
}

export interface Contact {
    name: string;
    email: string;
    phoneNumber: string;
}

export interface PublicationOptions {
    contactEmail: boolean;
    contactName: boolean;
    contactPhone: boolean;
    modelName: boolean;
    modelSummary: boolean;
    presentedBy: boolean;
    address: boolean;
    externalUrl: boolean;
}

export interface Room {
    id: string;
    meshId: number;
    floor: RoomClass;
    dimensions: RoomDimensions;
    tags: string[];
}

export interface RoomDimensions {
    height?: number;
    areaFloor: number;
}

export interface View {
    id: string;
    type: string;
    name: string;
    enabled: boolean;
    created: Date;
    modified: Date;
    layers: LayerElement[];
}

export interface LayerElement {
    layer: LayerLayer;
    position: number;
    visible: boolean;
}

export interface LayerLayer {
    id: string;
    created: Date;
    modified: Date;
    type: string;
    label: string;
}
