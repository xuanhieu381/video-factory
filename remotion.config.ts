import {Config} from '@remotion/cli/config';
import {CHROME, THUONG_HIEU_MAC_DINH} from './pipeline/cau-hinh.mjs';
import {ganThuongHieu} from './pipeline/thuong-hieu.mjs';

Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('jpeg');
// Repo nằm trên ổ exFAT thì đặt CHROME_HEADLESS trong .env (xem README)
if (CHROME) Config.setBrowserExecutable(CHROME);
// Studio xem thương hiệu khác: THUONG_HIEU=<ma> npm run studio
Config.overrideWebpackConfig(ganThuongHieu(THUONG_HIEU_MAC_DINH));
