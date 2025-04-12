import fs from 'fs';
import path from 'path';

const UPDATE_LOG = 'UPDATE_LOG.md';

export default function updatelog(tag, type = 'updater') {
    const reTag = /## v[\d\.]+/;

    const file = path.join(process.cwd(), UPDATE_LOG);

    // 如果UPDATE_LOG.md不存在，创建一个新的
    if (!fs.existsSync(file)) {
        console.log(`${UPDATE_LOG} 文件不存在，创建新文件...`);
        fs.writeFileSync(file, '# 更新日志\n\n');
    }

    let _tag;
    const tagMap = {};
    const content = fs.readFileSync(file, { encoding: 'utf8' }).split('\n');

    content.forEach((line, index) => {
        if (reTag.test(line)) {
            _tag = line.slice(3).trim();
            if (!tagMap[_tag]) {
                tagMap[_tag] = [];
                return;
            }
        }
        if (_tag) {
            tagMap[_tag].push(line);
        }
        if (reTag.test(content[index + 1])) {
            _tag = null;
        }
    });

    // 如果标签不存在，且是发布操作，创建新标签记录
    if (!tagMap?.[tag] && type === 'release') {
        console.log(`创建新的标签记录: ${tag}`);

        // 创建新标签的内容
        const newEntry = `\n## ${tag}\n- 版本更新\n`;

        // 如果文件内容为空或只有标题，添加到文件末尾
        if (content.length <= 2) {
            fs.appendFileSync(file, newEntry);
        } else {
            // 否则插入到标题之后，其他内容之前
            const newContent = content.slice(0, 2).join('\n') + newEntry + content.slice(2).join('\n');
            fs.writeFileSync(file, newContent);
        }

        // 返回新创建的标签内容
        return '- 版本更新';
    } else if (!tagMap?.[tag]) {
        // 如果不是发布操作且标签不存在，报错
        console.log(`${type === 'release' ? '[UPDATE_LOG.md] ' : ''}Tag ${tag} does not exist`);

        // 不再中断流程，而是返回空字符串
        return '';
    }

    // 返回标签内容
    return tagMap[tag].join('\n').trim() || '';
} 