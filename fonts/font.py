from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter

def compress_font(input_path, output_path, keep_chars):
    # 加载字体文件
    font = TTFont(input_path)
    
    # 创建子集器并设置要保留的字符
    subsetter = Subsetter()
    subsetter.populate(text=keep_chars)  # 传入需要保留的字符
    subsetter.subset(font)  # 执行子集化
    
    # 保存压缩后的字体
    font.save(output_path)
    print(f"字体已压缩并保存至: {output_path}")

if __name__ == "__main__":
    # 从文件读取需要保留的汉字
    with open('extracted_chinese_chars.txt', 'r', encoding='utf-8') as f:
        keep_chars = f.read().strip()
    
    
    # 压缩字体
    compress_font(
        input_path="LXGW.ttf",  # 替换为你的原始字体文件
        output_path="LXGW.woff",  # 压缩后的字体文件
        keep_chars=keep_chars
    )
    