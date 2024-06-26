import {
	v4 as uuidv4
} from 'uuid'
import axios from '../axios/index.js'
import WaveSurfer from 'wavesurfer.js'
import {
	sound,
	Sound
} from '@pixi/sound';
sound.disableAutoPause = true

export class Resource {
	/* 文件名 */
	name = null
	/* 标签 */
	tag = null;
	/* 文件类型 */
	type = null;
	/* 原始时长(ms) */
	duration = 0
	/* 资源大小 */
	size = 0
	/* 资源加载完成 */
	loaded = false
	/* 网络地址 */
	url = null
	/* 本地地址 */
	blobUrl = null;
	/* 封面 */
	cover = null

	constructor({
		name,
		type
	}) {
		this.id = uuidv4();
		this.name = name;
		this.type = type
	}

	clone() {
		return this;
	}

	destroy() {}

	get view() {
		return '';
	}

	get serialize() {
		return {
			id: this.id,
			name: this.name,
			tag: this.tag,
			type: this.type,
			duration: this.duration,
			size: this.size,
			url: this.url,
			blobUrl: this.blobUrl,
			cover: this.cover,
		}
	}
}

/* 异步反序列加载远程文件 */
async function ResourceDeserialize(data) {
	let resource = null
	if (data.type == 'video') {
		resource = await VideoResource.url(data.url, data.name)
		await resource.init()
	} else
	if (data.type == 'image') {
		resource = new ImageResource({
			name: data.name,
			url: data.url
		});
	}
	if (data.type == 'figure') {
		resource = new FigureResource({
			name: data.name,
			tag: data.tag,
			url: data.url,
			cover: data.cover
		});
	}
	resource.duration = data.duration;
	resource.size = data.size;
	resource.loaded = true
	return resource;
}

export class FigureResource extends Resource {
	constructor({
		name,
		tag,
		url,
		cover
	}) {
		super({
			name,
			type: 'figure'
		})
		this.url = url;
		this.blobUrl = url;
		this.cover = cover;
		this.tag = tag;
		this.duration = 6000;
		this.loaded = true;
	}

	clone() {
		return this;
	}

	get view() {
		return `<div style="${ImageResourceStyle} background-image: url(${this.cover});"></div>`
	}
}

export class TextResource extends Resource {
	constructor(name) {
		super({
			name,
			type: 'text'
		})
		this.duration = 6000
		this.loaded = true
	}
	
	clone() {
		const textResource = new TextResource(this.name)
		textResource.duration = this.duration
		return textResource;
	}

	get view() {
		return `<span style="line-height: 40px;font-size:12px;padding-left:5px;">${this.name}</span>`
	}
}


export class AudioResource extends Resource {
	volume = 1
	_wavesurfer = null
	_audio = null
	_sound = null
	_instance = null

	constructor({
		name,
		url,
		duration
	}) {
		super({
			name,
			type: 'audio'
		})
		this.url = url;
		this.blobUrl = url;
		this.duration = duration;
		this._sound = Sound.from({
			url: this.url
		});
		this.loaded = true;
	}

	static async file(resource) {
		const audioResource = new AudioResource({
			name: resource.name,
			url: URL.createObjectURL(resource),
			duration: 0
		});
		await audioResource.init()
		return audioResource
	}

	static async url(url, name) {
		const blob = await axios.get(url, {
			responseType: 'blob'
		})
		const file = new File([blob], name, {
			type: blob.type
		})
		const audioResource = await AudioResource.file(file);
		audioResource.url = url;
		return audioResource;
	}

	init() {
		return new Promise((resolve, reject) => {
			this._audio = new Audio(this.blobUrl);
			this._audio.addEventListener('canplaythrough', () => {
				this.duration = parseInt(this._audio.duration * 1000)
				this.loaded = true
				resolve()
			});
		})
	}

	clone() {
		const audioResource = new AudioResource({
			name: this.name,
			url: this.url,
			duration: this.duration
		})
		return audioResource;
	}

	play(currentTime) {
		if (this._instance == null) {
			this._instance = this._sound.play({
				start: currentTime / 1000,
				volume: this.volume
			});
		}
	}

	pause() {
		this._sound.pause();
		this._instance = null;
	}

	get view() {
		return `<div id="${this.id}" style=" position: relative; padding-top:10px;">
			<span style="${NameStyle}">${this.name}</span>
		</div>`
	}

	viewRender() {
		this._wavesurfer = WaveSurfer.create({
			container: document.getElementById(this.id),
			url: this.url,
			interact: false,
			height: 40
		})
	}
}

export class ImageResource extends Resource {
	constructor({
		name,
		url
	}) {
		super({
			name,
			type: 'image'
		})
		this.url = url;
		this.blobUrl = url;
		this.cover = url;
		this.duration = 6000
		this.loaded = true
	}

	static file(resource) {
		return new ImageResource({
			name: resource.name,
			url: URL.createObjectURL(resource)
		});
	}


	get view() {
		return `<div style="${ImageResourceStyle} background-image: url(${this.cover});">
			<span style="${NameStyle}">${this.name}</span>
		</div>`
	}

}

export class VideoResource extends Resource {
	_file = null;
	_video = null;

	constructor({
		name,
		url,
		cover,
		duration,
		size
	}) {
		super({
			name,
			type: 'video'
		})
		this.url = url;
		this.blobUrl = url;
		this.cover = cover;
		this.duration = duration;
		this.size = size;
		this.loaded = true
	}

	static async file(resource) {
		const videoResource = new VideoResource({
			name: resource.name,
			url: URL.createObjectURL(resource),
			size: resource.size,
			duration: 0
		});
		videoResource.blobUrl = URL.createObjectURL(resource)
		videoResource._file = resource
		await videoResource.init()
		return videoResource
	}

	static async url(url, name) {
		const blob = await axios.get(url, {
			responseType: 'blob'
		})
		const file = new File([blob], name, {
			type: blob.type
		})
		const videoResource = VideoResource.file(file)
		videoResource.url = url
		return videoResource;
	}

	async clone() {
		const videoResource = new VideoResource({
			name: this.name,
			url: this.url,
			cover: this.cover,
			duration: this.duration,
			size: this.size
		})
		if (this._file != null) {
			videoResource._file = this._file
			videoResource.blobUrl = URL.createObjectURL(videoResource._file)
		} else {
			videoResource.blobUrl = `${this.url}?id=${videoResource.id}`
		}
		return videoResource;
	}

	destroy() {
		if (this._video) this._video.remove()
	}

	init() {
		return new Promise((resolve, reject) => {
			if (this.duration == 0) {
				this._video = document.createElement('video');
				this._video.src = this.blobUrl;
				this._video.load();
				this._video.addEventListener('loadedmetadata', async () => {
					this.duration = parseInt(this._video.duration * 1000)
					if (this.cover == null) {
						this._video.pause();
						this._video.currentTime = parseInt(this._video.duration / 3)
					} else {
						this.loaded = true
						resolve()
					}
				});
				this._video.addEventListener('timeupdate', async () => {
					if (this._video.currentTime > 0) {
						const coverBlob = await this.screenshot(160, 90);
						this.cover = URL.createObjectURL(coverBlob)
						this.loaded = true
						resolve()
					}
				});
			} else {
				resolve()
			}
		})
	}

	screenshot(width = 320, height = 240) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				let canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				let scale = this._video.videoWidth / width;
				let frameWidth = width;
				let frameHeight = this._video.videoHeight / scale;
				let framePositionLeft = (width - frameWidth) / 2;
				let framePositionHeight = (height - frameHeight) / 2;
				canvas.getContext("2d").drawImage(this._video, framePositionLeft,
					framePositionHeight, frameWidth, frameHeight);
				canvas.toBlob((blob) => resolve(blob))
			}, 500)
		})
	}

	get view() {
		return `<div style="${ImageResourceStyle} background-image: url(${this.cover});">
			<span style="${NameStyle}">${this.name}</span>
		</div>`
	}

}

const ImageResourceStyle = `
	width: 100%;
    height: 100%;
    background-repeat: repeat-x;
    background-size: contain;
	background-position: left;
`

const NameStyle = `
	position: absolute; 
	max-width: 100%; 
	overflow: hidden; 
	text-overflow: ellipsis; 
	white-space: nowrap; 
	font-size:10px; 
	top: 0; 
	padding-left: 2px;
`

export {
	ResourceDeserialize
}