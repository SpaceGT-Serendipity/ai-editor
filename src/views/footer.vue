<template>
	<div class="footer">
		<el-alert :title="stateStore.alert?stateStore.alert:'状态栏'" type="info" show-icon :closable="false" />
		<div class="short-message">
			<el-tag type="info">网络状态
				<el-text v-if="online" type="success" size="small">在线</el-text>
				<el-text v-else type="danger" size="small">离线</el-text>
			</el-tag>
			<el-tag type="info">画布分辨率 {{globalStore.width}} x {{globalStore.height}}</el-tag>
			<el-tag type="info">视频总时长 {{dateFormat(layersDataStore.videoTotalDuration,'hh:mm:ss.SS')}}</el-tag>
			<el-tag type="info" :class="{'open-debug':globalStore.debug}"
				@click="openDebug(!globalStore.debug)">Debug</el-tag>
		</div>
	</div>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import {
		useGlobalStore,
		useStateStore
	} from '../store/global.js'
	import {
		useLayersDataStore
	} from '../store/layers.js'
	import {
		dateFormat
	} from '../utils/time.js'
	import {
		useOnline
	} from '@vueuse/core'

	const globalStore = useGlobalStore()
	const stateStore = useStateStore()
	const layersDataStore = useLayersDataStore()
	const online = useOnline()

	const openDebug = (state) => {
		globalStore.debug = state
		if (globalStore.debug) document.querySelector('html').classList.add('debug-open')
		else document.querySelector('html').classList.remove('debug-open')
	}

	onMounted(() => {
		openDebug(globalStore.debug)
	})
</script>

<style scoped>
	.footer {
		height: 100%;
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.el-alert {
		width: initial;
		padding: 0;
		padding-right: 40px;
		background-color: initial;
	}

	.short-message {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.open-debug {
		color: aqua;
	}
</style>