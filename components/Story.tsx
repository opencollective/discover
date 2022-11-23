import React from 'react';
import styled from 'styled-components';

const Markdown = styled.div`
  line-height: 1.625;
  p,
  ul,
  ol,
  blockquote {
    margin: 16px 0;
  }

  h1 {
    margin: 0 0 8px 0;
    line-height: 1.375;
    font-size: 28px;
    font-weight: 700;
  }
  h2 {
    margin: 8px 0;
    line-height: 1.375;
    font-weight: 500;
    font-size: 18px;
  }

  h3 {
    margin: 32px 0 16px 0;
    line-height: 1.375;
  }
`;

const Tag = styled.div`
  background: ${({ color }) => color ?? '#333'};
  color: white;
  padding: 4px 12px;
  border-radius: 99px;

  display: inline-block;
`;

// const Video = ({ src, title }) => {
//   return (
//     <iframe
//       className="video"
//       title={title}
//       src={src}
//       frameBorder="0"
//       allow="accelerometer; autoplay; encrypted-media; gyroscope;"
//       allowFullScreen
//     ></iframe>
//   );
// };
export default function Stories({ stories }) {
  if (!stories?.length) {
    return null;
  }
  return (
    <div className="mt-12 grid grid-cols-4 gap-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-400">Featured stories</h1>
      </div>
      <div className="col-span-3 grid grid-cols-2 gap-8">
        {stories.map(story => (
          <div className="rounded-lg bg-white p-8" key={story.slug}>
            {/* {story.video && <Video src={story.video.src} title={story.video.title} />} */}
            <div className="">
              {/* <h1>{story.title}</h1>
        <h2>{story.subtitle}</h2> */}
              <Markdown dangerouslySetInnerHTML={{ __html: story.content }} />
              <div className="meta">
                <div className="tags">
                  {story.tags.map(tag => (
                    <Tag color={tag.color} key={tag.tag}>
                      {tag.tag}
                    </Tag>
                  ))}
                </div>
                {/* <div>{story.location}</div> */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
