import axios, { AxiosRequestConfig } from 'axios';

// https://hooks.slack.com/services/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

const slackType = {
  0: 'good',
  1: 'warning',
  2: 'danger',
} as const;

class Slack {
  static url: string;

  static setUrl(url: string) {
    this.url = url;
  }

  static async message(title: string, comment: string, type?: keyof typeof slackType) {
    const config: AxiosRequestConfig = {
      method: 'post',
      url: this.url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        color: type || 'good',
        fields: [
          {
            title,
            value: comment,
            short: false, // `value`가 다른 값과 나란히 표시될 정도로 짧은지를 나타내는 옵션 플래그
          },
        ],
      },
    };

    try {
      await axios(config);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
}

export default Slack;

/*
const t0 = performance.now();
Slack.setUrl('https://hooks.slack.com/services/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');
const t1 = performance.now();
Slack.message('안내', `서비스가 실제 실행중입니다 \n${(t1 - t0).toFixed(5)} ms`, 0);
*/
