import * as React from 'react';
import { BaseDocsBlock, DocExample } from '../common';

export class RichTextEditorDoc extends BaseDocsBlock {
    title = 'Rich Text Editor';
    renderContent() {
        return (
            <span className="uui-theme-promo">
                <DocExample path="./_examples/richTextEditor/Basic.example.tsx" />
                <DocExample title="HTML format" path="./_examples/richTextEditor/Serialization.example.tsx" />
                <DocExample title="Inner scroll behavior" path="./_examples/richTextEditor/WithInnerScroll.example.tsx" />
            </span>
        );
    }
}
